const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// ==========================================
// CONFIGURATION
// ==========================================
const ARONIUM_DB_PATH = 'C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db'; 
const VERCEL_APP_URL = process.env.VERCEL_APP_URL || 'https://technextmanage.vercel.app';
const SYNC_SECRET = process.env.SYNC_SECRET || 'technext-sync-2026';
const LOCK_FILE = path.join(__dirname, 'sync-agent.lock');
const isOnce = process.argv.includes('--once');

let isSyncing = false;
let syncTimeout = null;
let lastSelfWriteTime = 0;

// ==========================================
// SINGLE-INSTANCE MANAGEMENT
// ==========================================
function acquireLock() {
  if (isOnce) return true; // --once runs can proceed

  if (fs.existsSync(LOCK_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      // Check if process with this PID is still running
      if (pid && !isNaN(pid)) {
        try {
          process.kill(pid, 0); // throws error if process does not exist
          console.log(`[INFO] Aronium Sync Agent is already running (PID: ${pid}). Exiting duplicate instance.`);
          process.exit(0);
        } catch {
          // Process not running, stale lock file
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
console.log("🚀 TechNext Aronium POS Bidirectional Cloud Sync Engine");
console.log("========================================================");
console.log(`📁 Local Database: ${ARONIUM_DB_PATH}`);
console.log(`🌐 Cloud Endpoint: ${VERCEL_APP_URL}`);
console.log(`⚙️  Execution Mode: ${isOnce ? 'Single-Pass (--once)' : 'Continuous Daemon (Watcher + Interval)'}`);
console.log("========================================================\n");

// ==========================================
// MAIN SYNC FUNCTION
// ==========================================
async function performSync() {
  if (isSyncing) return;
  isSyncing = true;
  
  const startTime = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] Starting Bidirectional Sync...`);
  
  if (!fs.existsSync(ARONIUM_DB_PATH)) {
    console.error(`❌ Error: Could not find Aronium database at ${ARONIUM_DB_PATH}`);
    isSyncing = false;
    return;
  }

  // Open SQLite database in READWRITE mode so we can pull CRM customers into Aronium
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
    // ----------------------------------------------------
    // STEP 1: PULL CRM CUSTOMERS -> ARONIUM POS
    // ----------------------------------------------------
    try {
      console.log("[PULL] Checking for pending CRM customers...");
      const pullRes = await fetch(`${VERCEL_APP_URL}/api/sync/send-aronium`, {
        headers: { "Authorization": `Bearer ${SYNC_SECRET}` }
      });

      if (pullRes.ok) {
        const pullData = await pullRes.json();
        const pendingCustomers = pullData.customers || [];
        
        if (pendingCustomers.length > 0) {
          console.log(`[PULL] Found ${pendingCustomers.length} pending CRM customers. Syncing to local Aronium POS...`);
          const confirmations = [];

          for (const c of pendingCustomers) {
            if (!c.name) continue;

            // Check if customer already exists in Aronium by Name, Phone, or Code
            const existing = await queryDB(
              `SELECT Id, Name, PhoneNumber, Code FROM Customer 
               WHERE Name = ? OR (PhoneNumber IS NOT NULL AND PhoneNumber != '' AND PhoneNumber != '0000000000' AND PhoneNumber = ?)
               LIMIT 1`,
              [c.name, c.phone || '']
            );

            let aroniumId = null;

            if (existing && existing.length > 0) {
              aroniumId = existing[0].Id;
              // Update code/details if needed
              await runDB(
                `UPDATE Customer SET 
                   Code = COALESCE(?, Code), 
                   PhoneNumber = COALESCE(?, PhoneNumber), 
                   Email = COALESCE(?, Email), 
                   Address = COALESCE(?, Address),
                   DateUpdated = DATETIME('now', 'localtime')
                 WHERE Id = ?`,
                [c.code || null, c.phone || null, c.email || null, c.address || null, aroniumId]
              );
              console.log(`  🔗 Matched & Updated existing Aronium Customer #${aroniumId}: "${c.name}"`);
            } else {
              // Insert new customer into Aronium
              const insertRes = await runDB(
                `INSERT INTO Customer (
                   Name, Code, PhoneNumber, Email, Address, 
                   IsCustomer, IsSupplier, IsEnabled, DateCreated, DateUpdated
                 ) VALUES (?, ?, ?, ?, ?, 1, 0, 1, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))`,
                [c.name, c.code || null, c.phone || '0000000000', c.email || null, c.address || null]
              );
              aroniumId = insertRes.lastID;
              console.log(`  ✨ Created new Aronium Customer #${aroniumId}: "${c.name}"`);
            }

            if (aroniumId) {
              confirmations.push({ crmId: c.id, aroniumId: aroniumId.toString() });
            }
          }

          if (confirmations.length > 0) {
            await fetch(`${VERCEL_APP_URL}/api/sync/confirm-aronium`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SYNC_SECRET}`
              },
              body: JSON.stringify({ confirmations })
            });
            console.log(`[PULL] Successfully linked ${confirmations.length} customers between Cloud CRM & Aronium POS.`);
          }
        } else {
          console.log("[PULL] All CRM customers are already in sync with local Aronium POS.");
        }
      } else {
        console.warn(`[PULL] Warning: Cloud returned status ${pullRes.status} for send-aronium.`);
      }
    } catch (pullErr) {
      console.error("[PULL] Error pulling customers from Cloud:", pullErr.message);
    }

    // ----------------------------------------------------
    // STEP 2: PUSH ARONIUM POS DATA -> CLOUD CRM
    // ----------------------------------------------------
    console.log("[PUSH] Extracting local Aronium records...");

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

    // 3. Fetch Products with Current Stock & Barcode
    const products = await queryDB(`
      SELECT 
        p.Id, p.Name, p.Code, p.Price, p.Cost,
        COALESCE(s.Quantity, 0) as CurrentStock,
        b.Value as Barcode
      FROM Product p
      LEFT JOIN Stock s ON p.Id = s.ProductId
      LEFT JOIN Barcode b ON p.Id = b.ProductId
      GROUP BY p.Id
    `);

    // 4. Fetch Sales with Payment Method & Customer Name
    const sales = await queryDB(`
      SELECT 
        d.Id, d.Number, d.Date, d.Total, d.CustomerId, d.Discount, d.PaidStatus,
        COALESCE(pt.Name, 'CASH') as PaymentMethod,
        c.Name as CustomerName
      FROM Document d
      LEFT JOIN Payment p ON d.Id = p.DocumentId
      LEFT JOIN PaymentType pt ON p.PaymentTypeId = pt.Id
      LEFT JOIN Customer c ON d.CustomerId = c.Id
      WHERE d.DocumentTypeId = 2
      GROUP BY d.Id
      ORDER BY d.Date DESC
    `);

    // 5. Fetch Purchases with Vendor Name
    const purchases = await queryDB(`
      SELECT 
        d.Id, d.Number, d.Date, d.Total, d.CustomerId,
        c.Name as VendorName
      FROM Document d
      LEFT JOIN Customer c ON d.CustomerId = c.Id
      WHERE d.DocumentTypeId = 1
      GROUP BY d.Id
      ORDER BY d.Date DESC
    `);

    console.log(`[PUSH] Local Catalog: ${customers.length} Customers, ${suppliers.length} Vendors, ${products.length} Products, ${sales.length} Sales, ${purchases.length} Purchases.`);
    
    const payload = { customers, suppliers, products, sales, purchases };

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
      console.log(`✅ [SUCCESS] Cloud Sync completed in ${elapsed}s!`);
      console.log(`📊 Cloud Updated: ${result.salesCount} Sales, ${result.purchasesCount} Purchases, ${result.productsCount} Products, ${result.customersCount} Customers, ${result.vendorsCount} Vendors.`);
    } else {
      console.error("❌ Cloud Error:", result.error || response.statusText);
    }

  } catch (error) {
    console.error("❌ Fatal Sync Error:", error.message || error);
  } finally {
    db.close();
    isSyncing = false;
    if (isOnce) {
      console.log("[INFO] Single-pass sync completed. Exiting.");
      process.exit(0);
    }
  }
}

// Initial Sync
performSync();

// If not in single-pass mode, set up file watcher and timer
if (!isOnce) {
  // Watch Aronium SQLite database for changes
  try {
    fs.watch(ARONIUM_DB_PATH, (eventType) => {
      if (eventType === 'change') {
        if (Date.now() - lastSelfWriteTime < 8000) {
          return; // Skip changes triggered by our own sync agent writing to SQLite
        }
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          performSync();
        }, 2500); // 2.5s debounce to allow SQLite commit to finish
      }
    });
    console.log(`👀 Actively watching ${ARONIUM_DB_PATH} for real-time sales & updates.`);
  } catch (watchErr) {
    console.warn("⚠️ Could not establish fs.watch:", watchErr.message);
  }

  // Periodic fallback sync every 15 minutes
  setInterval(performSync, 15 * 60 * 1000);
}
