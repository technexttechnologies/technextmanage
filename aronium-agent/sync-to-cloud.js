const fs = require('fs');
const path = require('path');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();

// ==========================================
// CONFIGURATION
// ==========================================
const ARONIUM_DB_PATH = 'C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db'; 
const VERCEL_APP_URL = process.env.VERCEL_APP_URL || 'https://technextmanage.vercel.app';
const SYNC_SECRET = process.env.SYNC_SECRET || 'technext-sync-2026';
const HTTP_PORT = 4040;
const LOCK_FILE = path.join(__dirname, 'sync-agent.lock');
const isOnce = process.argv.includes('--once');

let isSyncing = false;
let syncTimeout = null;
let lastSelfWriteTime = 0;
let lastSyncTime = null;
let lastSyncResult = null;

// ==========================================
// SINGLE-INSTANCE MANAGEMENT
// ==========================================
function acquireLock() {
  if (isOnce) return true;

  if (fs.existsSync(LOCK_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      if (pid && !isNaN(pid) && pid !== process.pid) {
        try {
          process.kill(pid, 0); // Throws if process does not exist
          console.log(`[INFO] Killing existing Aronium Sync Agent (PID: ${pid}) to replace with upgraded two-way sync.`);
          try { process.kill(pid, 'SIGTERM'); } catch (e) {}
        } catch {
          console.log(`[INFO] Removing stale lock file from previous PID ${pid}.`);
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  try {
    fs.writeFileSync(LOCK_FILE, process.pid.toString(), 'utf8');
  } catch (err) {
    console.error("Failed to write lock file:", err.message);
  }
  return true;
}

function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      if (pid === process.pid) {
        fs.unlinkSync(LOCK_FILE);
      }
    } catch {
      // Ignore errors on exit
    }
  }
}

process.on('exit', releaseLock);
process.on('SIGINT', () => { releaseLock(); process.exit(0); });
process.on('SIGTERM', () => { releaseLock(); process.exit(0); });

acquireLock();

console.log("\n========================================================");
console.log("🚀 TechNext Aronium POS Two-Way Full-Auto Sync Engine");
console.log("========================================================");
console.log(`📁 Local Database: ${ARONIUM_DB_PATH}`);
console.log(`🌐 Cloud Endpoint: ${VERCEL_APP_URL}`);
console.log(`⚡ Two-Way Mode: Customers, Vendors, Products, Invoices & Refunds`);
console.log(`⚙️  Execution: Real-time DB Watcher + 15s Interval + HTTP Webhook`);
console.log("========================================================\n");

// ==========================================
// MAIN BIDIRECTIONAL SYNC FUNCTION
// ==========================================
async function performSync() {
  if (isSyncing) return;
  isSyncing = true;
  
  const startTime = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] 🔄 Starting Full Bidirectional Sync...`);
  
  if (!fs.existsSync(ARONIUM_DB_PATH)) {
    console.error(`❌ Error: Could not find Aronium database at ${ARONIUM_DB_PATH}`);
    isSyncing = false;
    return;
  }

  // Open SQLite database in READWRITE mode
  const db = new sqlite3.Database(ARONIUM_DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error("❌ SQLite Connection Error:", err.message);
    }
  });

  const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  };

  const runDB = (sql, params = []) => {
    lastSelfWriteTime = Date.now();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };

  try {
    // =========================================================================
    // STEP 1: PULL FROM CLOUD -> ARONIUM LOCAL POS (CUSTOMERS, VENDORS, PRODUCTS, INVOICES)
    // =========================================================================
    try {
      const pullRes = await fetch(`${VERCEL_APP_URL}/api/sync/send-aronium`, {
        headers: { "Authorization": `Bearer ${SYNC_SECRET}` }
      });

      if (pullRes.ok) {
        const pullData = await pullRes.json();
        const pendingCustomers = pullData.customers || [];
        const pendingSuppliers = pullData.suppliers || [];
        const pendingProducts = pullData.products || [];
        const pendingDocuments = pullData.documents || [];

        const customerConfirmations = [];
        const supplierConfirmations = [];
        const productConfirmations = [];
        const documentConfirmations = [];

        // 1a. Pull Customers -> Aronium Customer
        for (const c of pendingCustomers) {
          if (!c.name) continue;
          try {
            const existing = await queryDB(
              `SELECT Id, Name, PhoneNumber, Code FROM Customer 
               WHERE Code = ? OR Name = ? OR (PhoneNumber IS NOT NULL AND PhoneNumber != '' AND PhoneNumber != '0000000000' AND PhoneNumber = ?)
               LIMIT 1`,
              [c.code || '', c.name, c.phone || '']
            );

            let aroniumId = null;
            if (existing && existing.length > 0) {
              aroniumId = existing[0].Id;
              await runDB(
                `UPDATE Customer SET 
                   Name = COALESCE(?, Name),
                   Code = COALESCE(?, Code), 
                   PhoneNumber = COALESCE(?, PhoneNumber), 
                   Email = COALESCE(?, Email), 
                   Address = COALESCE(?, Address),
                   DateUpdated = DATETIME('now', 'localtime')
                 WHERE Id = ?`,
                [c.name || null, c.code || null, c.phone || null, c.email || null, c.address || null, aroniumId]
              );
              console.log(`  🔄 [PULL] Updated Aronium Customer #${aroniumId}: "${c.name}"`);
            } else {
              const insertRes = await runDB(
                `INSERT INTO Customer (
                   Name, Code, PhoneNumber, Email, Address, 
                   IsCustomer, IsSupplier, IsEnabled, DateCreated, DateUpdated
                 ) VALUES (?, ?, ?, ?, ?, 1, 0, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                [c.name, c.code || null, c.phone || '0000000000', c.email || null, c.address || null]
              );
              aroniumId = insertRes.lastID;
              console.log(`  ✨ [PULL] Created Aronium Customer #${aroniumId}: "${c.name}"`);
            }
            if (aroniumId) {
              customerConfirmations.push({ crmId: c.id, aroniumId: aroniumId.toString() });
            }
          } catch (e) {
            console.error(`  ⚠️ Customer Sync Error for "${c.name}":`, e.message);
          }
        }

        // 1b. Pull Suppliers -> Aronium Customer (IsSupplier = 1)
        for (const s of pendingSuppliers) {
          if (!s.name) continue;
          try {
            const existing = await queryDB(
              `SELECT Id, Name, PhoneNumber FROM Customer 
               WHERE IsSupplier = 1 AND (Name = ? OR (PhoneNumber IS NOT NULL AND PhoneNumber != '' AND PhoneNumber = ?))
               LIMIT 1`,
              [s.name, s.phone || '']
            );

            let aroniumId = null;
            if (existing && existing.length > 0) {
              aroniumId = existing[0].Id;
              await runDB(
                `UPDATE Customer SET 
                   PhoneNumber = COALESCE(?, PhoneNumber), 
                   Email = COALESCE(?, Email), 
                   Address = COALESCE(?, Address),
                   DateUpdated = DATETIME('now', 'localtime')
                 WHERE Id = ?`,
                [s.phone || null, s.email || null, s.address || null, aroniumId]
              );
            } else {
              const insertRes = await runDB(
                `INSERT INTO Customer (
                   Name, Code, PhoneNumber, Email, Address, 
                   IsCustomer, IsSupplier, IsEnabled, DateCreated, DateUpdated
                 ) VALUES (?, ?, ?, ?, ?, 0, 1, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                [s.name, s.code || null, s.phone || '0000000000', s.email || null, s.address || null]
              );
              aroniumId = insertRes.lastID;
              console.log(`  ✨ [PULL] Created Aronium Vendor #${aroniumId}: "${s.name}"`);
            }
            if (aroniumId) {
              supplierConfirmations.push({ crmId: s.id, aroniumId: aroniumId.toString() });
            }
          } catch (e) {
            console.error(`  ⚠️ Vendor Sync Error for "${s.name}":`, e.message);
          }
        }

        // 1c. Pull Products -> Aronium Product, Stock, Barcode
        for (const p of pendingProducts) {
          if (!p.name) continue;
          try {
            // Resolve ProductGroup
            let groupId = null;
            const categoryName = p.category || "BILLING";
            const existingGroup = await queryDB(
              `SELECT Id FROM ProductGroup WHERE LOWER(Name) = LOWER(?) LIMIT 1`,
              [categoryName]
            );
            if (existingGroup && existingGroup.length > 0) {
              groupId = existingGroup[0].Id;
            } else {
              const grpRes = await runDB(`INSERT INTO ProductGroup (Name) VALUES (?)`, [categoryName]);
              groupId = grpRes.lastID;
            }

            const code = p.sku || p.aroniumId || `PROD-${p.id.slice(-4)}`;
            const isService = p.isService ? 1 : 0;
            const unit = p.unit || (isService ? "SOFTWARE" : "PCS");
            const price = parseFloat(p.sellingPrice) || 0;
            const cost = parseFloat(p.purchasePrice) || 0;

            const existingProd = await queryDB(
              `SELECT Id FROM Product WHERE Code = ? OR LOWER(Name) = LOWER(?) LIMIT 1`,
              [code, p.name]
            );

            let aroniumProdId = null;
            if (existingProd && existingProd.length > 0) {
              aroniumProdId = existingProd[0].Id;
              await runDB(
                `UPDATE Product SET 
                   Name = ?, 
                   Code = ?, 
                   MeasurementUnit = ?, 
                   Price = ?, 
                   Cost = ?, 
                   IsService = ?, 
                   ProductGroupId = ?,
                   DateUpdated = DATETIME('now', 'localtime')
                 WHERE Id = ?`,
                [p.name, code, unit, price, cost, isService, groupId, aroniumProdId]
              );
            } else {
              const insertRes = await runDB(
                `INSERT INTO Product (
                   ProductGroupId, Name, Code, MeasurementUnit, Price, Cost, 
                   IsService, IsEnabled, IsTaxInclusivePrice, DateCreated, DateUpdated
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                [groupId, p.name, code, unit, price, cost, isService]
              );
              aroniumProdId = insertRes.lastID;
              console.log(`  ✨ [PULL] Created Aronium Product #${aroniumProdId}: "${p.name}" (₹${price})`);
            }

            // Sync Barcode
            if (aroniumProdId && p.barcode) {
              await runDB(`DELETE FROM Barcode WHERE ProductId = ?`, [aroniumProdId]);
              await runDB(`INSERT INTO Barcode (ProductId, Value) VALUES (?, ?)`, [aroniumProdId, p.barcode]);
            }

            // Sync Stock for physical items
            if (aroniumProdId && !isService && p.currentStock !== undefined) {
              const existingStock = await queryDB(`SELECT Id FROM Stock WHERE ProductId = ? AND WarehouseId = 1`, [aroniumProdId]);
              if (existingStock && existingStock.length > 0) {
                await runDB(`UPDATE Stock SET Quantity = ? WHERE ProductId = ? AND WarehouseId = 1`, [parseFloat(p.currentStock) || 0, aroniumProdId]);
              } else {
                await runDB(`INSERT INTO Stock (ProductId, WarehouseId, Quantity) VALUES (?, 1, ?)`, [aroniumProdId, parseFloat(p.currentStock) || 0]);
              }
            }

            if (aroniumProdId) {
              productConfirmations.push({ crmId: p.id, aroniumId: aroniumProdId.toString() });
            }
          } catch (e) {
            console.error(`  ⚠️ Product Sync Error for "${p.name}":`, e.message);
          }
        }

        // 1d. Pull Documents (Invoices, Quotations, Refunds) -> Aronium Document
        for (const doc of pendingDocuments) {
          if (!doc.docNumber) continue;
          try {
            const existingDoc = await queryDB(
              `SELECT Id FROM Document WHERE Number = ? LIMIT 1`,
              [doc.docNumber]
            );

            if (existingDoc && existingDoc.length > 0) {
              if (doc.isEdited) {
                const docId = existingDoc[0].Id;
                const totalAmount = parseFloat(doc.totalAmount) || 0;
                const paidAmount = parseFloat(doc.paidAmount) || 0;
                const isPaid = doc.paymentStatus === 'Paid' || doc.status === 'PAID' || (paidAmount >= totalAmount && totalAmount > 0);
                const paidStatus = isPaid ? 2 : 1;

                // Resolve customer for edited document
                let aroniumCustomerId = null;
                if (doc.customerAroniumId) {
                  aroniumCustomerId = parseInt(doc.customerAroniumId, 10);
                }
                if (!aroniumCustomerId && doc.customerName) {
                  const cRow = await queryDB(
                    `SELECT Id FROM Customer WHERE Name = ? OR (PhoneNumber IS NOT NULL AND PhoneNumber != '' AND PhoneNumber = ?) LIMIT 1`,
                    [doc.customerName, doc.customerPhone || '']
                  );
                  if (cRow && cRow.length > 0) {
                    aroniumCustomerId = cRow[0].Id;
                  }
                }

                await runDB(
                  `UPDATE Document SET 
                     CustomerId = COALESCE(?, CustomerId),
                     Total = ?, 
                     PaidStatus = ?, 
                     DateUpdated = DATETIME('now', 'localtime') 
                   WHERE Id = ?`,
                  [aroniumCustomerId || null, totalAmount, paidStatus, docId]
                );

                // Replace DocumentItems
                await runDB(`DELETE FROM DocumentItem WHERE DocumentId = ?`, [docId]);
                if (doc.items && Array.isArray(doc.items)) {
                  for (const it of doc.items) {
                    const itQty = parseFloat(it.quantity) || 1;
                    const itPrice = parseFloat(it.unitPrice) || 0;
                    const itTotal = parseFloat(it.total) || (itQty * itPrice);
                    let pId = null;
                    if (it.name) {
                      const pRow = await queryDB(
                        `SELECT Id FROM Product WHERE Code = ? OR LOWER(Name) = LOWER(?) LIMIT 1`,
                        [it.code || '', it.name]
                      );
                      if (pRow && pRow.length > 0) {
                        pId = pRow[0].Id;
                      } else {
                        const newP = await runDB(
                          `INSERT INTO Product (ProductGroupId, Name, Code, MeasurementUnit, Price, IsService, IsEnabled, IsTaxInclusivePrice, DateCreated, DateUpdated)
                           VALUES (1, ?, ?, ?, ?, 1, 1, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                          [it.name, it.code || `ITEM-${docId}`, it.unit || 'Service', itPrice]
                        );
                        pId = newP.lastID;
                      }
                    }
                    await runDB(
                      `INSERT INTO DocumentItem (DocumentId, ProductId, ExpectedQuantity, Quantity, PriceBeforeTax, Price, Total)
                       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      [docId, pId || 1, itQty, itQty, itPrice, itPrice, itTotal]
                    );
                  }
                }

                // Update Payments if needed
                if (paidAmount > 0) {
                  await runDB(`DELETE FROM Payment WHERE DocumentId = ?`, [docId]);
                  await runDB(
                    `INSERT INTO Payment (DocumentId, PaymentTypeId, Amount, Date) VALUES (?, 4, ?, DATETIME('now', 'localtime'))`,
                    [docId, paidAmount]
                  );
                }
                console.log(`  🔄 [PULL] Updated edited Document #${doc.docNumber} in Aronium (Total: ₹${totalAmount}, Paid: ₹${paidAmount})`);
              }
              documentConfirmations.push({ crmId: doc.id, aroniumNumber: doc.docNumber });
              continue;
            }

            // Resolve Customer
            let aroniumCustomerId = null;
            if (doc.customerAroniumId) {
              aroniumCustomerId = parseInt(doc.customerAroniumId, 10);
            }
            if (!aroniumCustomerId && doc.customerName) {
              const cRow = await queryDB(
                `SELECT Id FROM Customer WHERE Name = ? OR (PhoneNumber IS NOT NULL AND PhoneNumber = ?) LIMIT 1`,
                [doc.customerName, doc.customerPhone || '']
              );
              if (cRow && cRow.length > 0) {
                aroniumCustomerId = cRow[0].Id;
              } else {
                const newC = await runDB(
                  `INSERT INTO Customer (Name, PhoneNumber, IsCustomer, IsSupplier, IsEnabled, DateCreated, DateUpdated)
                   VALUES (?, ?, 1, 0, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                  [doc.customerName, doc.customerPhone || '0000000000']
                );
                aroniumCustomerId = newC.lastID;
              }
            }

            const isRefund = doc.docType === 'REFUND';
            const isQuote = doc.docType === 'QUOTATION';
            const docTypeId = isRefund ? 4 : (isQuote ? 7 : 2);
            const isPaid = doc.paymentStatus === 'Paid' || doc.status === 'PAID' || isRefund;
            const totalAmount = parseFloat(doc.totalAmount) || 0;

            // Aronium POS .NET SQLite reader strictly requires format "YYYY-MM-DD HH:mm:ss"
            const rawDate = (doc.date ? String(doc.date).split('T')[0] : new Date().toISOString().split('T')[0]).slice(0, 10);
            const docDate = `${rawDate} 00:00:00`;
            const rawDueDate = doc.dueDate ? String(doc.dueDate).split('T')[0].slice(0, 10) : null;
            const docDueDate = rawDueDate ? `${rawDueDate} 00:00:00` : null;

            const docRes = await runDB(
              `INSERT INTO Document (
                 Number, UserId, CustomerId, Date, StockDate, DueDate, Total, 
                 DocumentTypeId, WarehouseId, PaidStatus, DateCreated, DateUpdated
               ) VALUES (?, 1, ?, ?, DATETIME('now', 'localtime'), ?, ?, ?, 1, ?, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
              [doc.docNumber, aroniumCustomerId || null, docDate, docDueDate, totalAmount, docTypeId, isPaid ? 1 : 0]
            );

            const newDocId = docRes.lastID;

            // Insert Line Items
            for (const it of (doc.items || [])) {
              let pId = null;
              const pRow = await queryDB(
                `SELECT Id FROM Product WHERE Code = ? OR LOWER(Name) = LOWER(?) LIMIT 1`,
                [it.code || '', it.name]
              );
              if (pRow && pRow.length > 0) {
                pId = pRow[0].Id;
              } else {
                const newP = await runDB(
                  `INSERT INTO Product (ProductGroupId, Name, Code, MeasurementUnit, Price, IsService, IsEnabled, IsTaxInclusivePrice, DateCreated, DateUpdated)
                   VALUES (1, ?, ?, ?, ?, ?, 1, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                  [it.name, it.code || `ITEM-${newDocId}`, it.unit || 'Service', parseFloat(it.unitPrice) || 0, it.isService ? 1 : 0]
                );
                pId = newP.lastID;
              }

              await runDB(
                `INSERT INTO DocumentItem (
                   DocumentId, ProductId, Quantity, PriceBeforeTax, Price, Total
                 ) VALUES (?, ?, ?, ?, ?, ?)`,
                [newDocId, pId, parseFloat(it.quantity) || 1, parseFloat(it.priceBeforeTax || it.unitPrice) || 0, parseFloat(it.unitPrice) || 0, parseFloat(it.total) || 0]
              );
            }

            // Insert Payment if Paid
            if (isPaid && !isQuote) {
              const method = (doc.paymentMethod || '').toUpperCase();
              const paymentTypeId = method.includes('CASH') ? 1 : (method.includes('CARD') ? 2 : 4);
              await runDB(
                `INSERT INTO Payment (DocumentId, PaymentTypeId, Amount, Date, UserId, DateCreated)
                 VALUES (?, ?, ?, ?, 1, DATETIME('now', 'localtime'))`,
                [newDocId, paymentTypeId, Math.abs(totalAmount), docDate]
              );
            }

            console.log(`  📄 [PULL] Created Aronium Document #${doc.docNumber} (${doc.docType}) for ₹${Math.abs(totalAmount)}`);
            documentConfirmations.push({ crmId: doc.id, aroniumNumber: doc.docNumber });
          } catch (e) {
            console.error(`  ⚠️ Document Sync Error for #${doc.docNumber}:`, e.message);
          }
        }

        // Send all confirmations back to Cloud
        if (customerConfirmations.length > 0 || supplierConfirmations.length > 0 || productConfirmations.length > 0 || documentConfirmations.length > 0) {
          await fetch(`${VERCEL_APP_URL}/api/sync/confirm-aronium`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SYNC_SECRET}`
            },
            body: JSON.stringify({
              customerConfirmations,
              supplierConfirmations,
              productConfirmations,
              documentConfirmations
            })
          });
          console.log(`[PULL] Confirmed to Cloud: ${customerConfirmations.length} Customers, ${supplierConfirmations.length} Vendors, ${productConfirmations.length} Products, ${documentConfirmations.length} Documents.`);
        }
      }
    } catch (pullErr) {
      console.error("[PULL] Error pulling from Cloud:", pullErr.message);
    }

    // =========================================================================
    // STEP 2: PUSH LOCAL ARONIUM POS DATA -> CLOUD CRM
    // =========================================================================
    // 1. Fetch Customers
    const customers = await queryDB(`
      SELECT Id, Name, Code, PhoneNumber, Email, Address 
      FROM Customer 
      WHERE IsCustomer = 1
    `);
    
    // 2. Fetch Suppliers
    const suppliers = await queryDB(`
      SELECT Id, Name, Code, PhoneNumber, Email, Address 
      FROM Customer 
      WHERE IsSupplier = 1
    `);

    // 3. Fetch Products with Group, Barcode, Stock
    const products = await queryDB(`
      SELECT 
        p.Id, p.Name, p.Code, p.Price, p.Cost, p.MeasurementUnit, p.IsService,
        COALESCE(pg.Name, 'General') as GroupName,
        COALESCE(s.Quantity, 0) as CurrentStock,
        b.Value as Barcode
      FROM Product p
      LEFT JOIN ProductGroup pg ON p.ProductGroupId = pg.Id
      LEFT JOIN Stock s ON p.Id = s.ProductId
      LEFT JOIN Barcode b ON p.Id = b.ProductId
      GROUP BY p.Id
    `);

    const getDocItems = async (docId) => {
      return await queryDB(`
        SELECT di.*, p.Name as ProductName, p.Code as ProductCode, p.MeasurementUnit, p.IsService
        FROM DocumentItem di
        LEFT JOIN Product p ON di.ProductId = p.Id
        WHERE di.DocumentId = ?
      `, [docId]);
    };

    const getDocPayments = async (docId) => {
      return await queryDB(`
        SELECT p.*, pt.Name as PaymentTypeName
        FROM Payment p
        LEFT JOIN PaymentType pt ON p.PaymentTypeId = pt.Id
        WHERE p.DocumentId = ?
        ORDER BY p.Date ASC
      `, [docId]);
    };

    // 4. Fetch Sales Invoices & Refunds (Type 2 and 4)
    const salesRaw = await queryDB(`
      SELECT 
        d.Id, d.Number, d.Date, d.Total, d.CustomerId, d.Discount, d.PaidStatus, d.DocumentTypeId,
        c.Name as CustomerName
      FROM Document d
      LEFT JOIN Customer c ON d.CustomerId = c.Id
      WHERE d.DocumentTypeId IN (2, 4)
      ORDER BY d.Date DESC
    `);

    const sales = [];
    for (const s of salesRaw) {
      const items = await getDocItems(s.Id);
      const payments = await getDocPayments(s.Id);
      const isRefund = s.DocumentTypeId === 4;
      const paymentMethod = isRefund ? 'REFUND / REVERSAL' : (payments.length > 1 ? 'SPLIT / MULTI-DATE' : (payments[0]?.PaymentTypeName || 'CASH'));
      sales.push({
        ...s,
        Total: isRefund ? -Math.abs(s.Total) : Math.abs(s.Total),
        isRefund,
        PaymentMethod: paymentMethod,
        items: items.length > 0 ? items : [
          {
            ProductName: 'Refund / Service Cancellation',
            ProductCode: s.Number,
            Quantity: 1,
            Price: isRefund ? -Math.abs(s.Total) : Math.abs(s.Total),
            Total: isRefund ? -Math.abs(s.Total) : Math.abs(s.Total),
            MeasurementUnit: 'Refund'
          }
        ],
        payments
      });
    }

    // 5. Fetch Proformas (Quotations, Type 7)
    const proformasRaw = await queryDB(`
      SELECT 
        d.Id, d.Number, d.Date, d.Total, d.CustomerId, d.Discount, d.PaidStatus,
        c.Name as CustomerName
      FROM Document d
      LEFT JOIN Customer c ON d.CustomerId = c.Id
      WHERE d.DocumentTypeId = 7
      ORDER BY d.Date DESC
    `);

    const proformas = [];
    for (const pf of proformasRaw) {
      const items = await getDocItems(pf.Id);
      proformas.push({
        ...pf,
        items
      });
    }

    // 6. Fetch Purchases (Type 1)
    const purchasesRaw = await queryDB(`
      SELECT 
        d.Id, d.Number, d.Date, d.Total, d.CustomerId,
        c.Name as VendorName
      FROM Document d
      LEFT JOIN Customer c ON d.CustomerId = c.Id
      WHERE d.DocumentTypeId = 1
      ORDER BY d.Date DESC
    `);

    const purchases = [];
    for (const p of purchasesRaw) {
      const items = await getDocItems(p.Id);
      purchases.push({
        ...p,
        items
      });
    }

    const payload = { customers, suppliers, products, sales, purchases, proformas };

    const response = await fetch(`${VERCEL_APP_URL}/api/erp/aronium/cloud-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SYNC_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      lastSyncTime = new Date().toISOString();
      lastSyncResult = {
        success: true,
        elapsed,
        salesCount: result.salesCount,
        proformasCount: result.proformasCount,
        productsCount: result.productsCount,
        customersCount: result.customersCount,
        vendorsCount: result.vendorsCount
      };
      console.log(`✅ [SUCCESS] Two-Way Sync finished in ${elapsed}s! Cloud Updated: ${result.salesCount} Invoices, ${result.proformasCount || 0} Quotes, ${result.productsCount} Products, ${result.customersCount} Customers.`);
    } else {
      console.error("❌ Cloud Error:", result.error || response.statusText);
      lastSyncResult = { success: false, error: result.error || response.statusText };
    }

  } catch (error) {
    console.error("❌ Fatal Sync Error:", error.message || error);
    lastSyncResult = { success: false, error: error.message };
  } finally {
    isSyncing = false;
    db.close((err) => {
      if (err) console.error("Error closing db:", err.message);
      if (isOnce) {
        console.log("[INFO] Single-pass sync completed.");
      }
    });
  }
}

// Watcher & Periodic Interval & Webhook (Only when running as continuous daemon)
if (!isOnce) {
  // ==========================================
  // LOCAL HTTP WEBHOOK SERVER FOR INSTANT PING
  // ==========================================
  const server = http.createServer((req, res) => {
    // Enable CORS so browser app on localhost or any port can trigger sync
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/sync') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Sync triggered immediately", timestamp: Date.now() }));
      setTimeout(() => performSync(), 100);
      return;
    }

    if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        running: true,
        lastSyncTime,
        lastSyncResult,
        isSyncing,
        dbPath: ARONIUM_DB_PATH
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  server.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`📡 Local Webhook Server active on http://127.0.0.1:${HTTP_PORT}/sync`);
  });

  try {
    fs.watch(ARONIUM_DB_PATH, (eventType) => {
      if (eventType === 'change') {
        if (Date.now() - lastSelfWriteTime < 6000) {
          return;
        }
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          performSync();
        }, 2000);
      }
    });
    console.log(`👀 Actively watching ${ARONIUM_DB_PATH} for real-time Aronium sales & updates.`);
  } catch (watchErr) {
    console.warn("⚠️ Could not establish fs.watch:", watchErr.message);
  }

  // Periodic Auto-Sync interval: Every 15 seconds!
  setInterval(performSync, 15 * 1000);
}

// Initial Sync
performSync();
