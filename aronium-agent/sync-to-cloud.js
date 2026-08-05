const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// ==========================================
// CONFIGURATION - CHANGE THESE SETTINGS
// ==========================================
const ARONIUM_DB_PATH = 'C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db'; 
const VERCEL_APP_URL = 'https://technextmanage.vercel.app'; // Your Vercel URL
const SYNC_SECRET = 'technext-sync-2026';
const SYNC_INTERVAL_MINUTES = 30; // Runs every 30 minutes
// ==========================================

console.log("\n🚀 TechNext Aronium Cloud Sync Agent Started");
console.log(`Syncing every ${SYNC_INTERVAL_MINUTES} minutes to: ${VERCEL_APP_URL}...`);

async function performSync() {
  console.log(`\n[${new Date().toLocaleString()}] Starting Cloud Sync...`);
  
  if (!fs.existsSync(ARONIUM_DB_PATH)) {
    console.error(`❌ Error: Could not find Aronium database at ${ARONIUM_DB_PATH}`);
    return;
  }

  // Connect to SQLite
  const db = new sqlite3.Database(ARONIUM_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error("❌ SQLite Connection Error:", err);
    }
  });

  const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    // 1. Fetch Customers
    const customers = await queryDB(`SELECT Id, Name, Code, PhoneNumber, Email, Address FROM Customer WHERE IsCustomer = 1`);
    
    // 2. Fetch Suppliers
    const suppliers = await queryDB(`SELECT Id, Name, Code, PhoneNumber, Email, Address FROM Customer WHERE IsSupplier = 1`);

    // 3. Fetch Products
    const products = await queryDB(`SELECT Id, Name, Code, Price, Cost FROM Product`);

    // 4. Fetch Sales
    const sales = await queryDB(`SELECT Id, Number, Date, Total, CustomerId FROM Document WHERE DocumentTypeId = 2`);

    // 5. Fetch Purchases
    const purchases = await queryDB(`SELECT Id, Number, Date, Total, CustomerId FROM Document WHERE DocumentTypeId = 1`);

    console.log(`[READ] Found: ${customers.length} Customers, ${suppliers.length} Suppliers, ${products.length} Products, ${sales.length} Sales, ${purchases.length} Purchases.`);
    
    // Send to Vercel
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
      console.log("✅ Sync Successful!");
      console.log(`Pushed to Dashboard: ${result.salesCount} Sales, ${result.purchasesCount} Purchases, ${result.vendorsCount} Vendors, ${result.customersCount} Customers, ${result.productsCount} Products.`);
    } else {
      console.error("❌ Sync Error:", result.error || response.statusText);
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error.message || error);
  } finally {
    db.close();
  }
}

// Initial Sync
performSync();

// Schedule Loop
setInterval(performSync, SYNC_INTERVAL_MINUTES * 60 * 1000);
