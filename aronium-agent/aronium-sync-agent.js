const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const http = require('http');

// ==========================================
// CONFIGURATION - CHANGE THESE SETTINGS
// ==========================================
const ARONIUM_DB_PATH = 'C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db'; // Update to exact path
const VERCEL_APP_URL = 'https://technextmanage.vercel.app'; // Your Vercel URL
const SYNC_SECRET = 'technext-sync-2026';
const SYNC_INTERVAL_MINUTES = 30;
// ==========================================

console.log('🚀 TechNext Aronium Two-Way Sync Agent Started');
console.log(`Syncing every ${SYNC_INTERVAL_MINUTES} minutes...`);

// ---- Helper: Send API Request ----
function apiRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(`${VERCEL_APP_URL}${endpoint}`);
  const reqModule = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${SYNC_SECRET}`,
        'Content-Type': 'application/json'
      }
    };
    
    let payload = '';
    if (body) {
      payload = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = reqModule.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', error => reject(error));
    if (body) req.write(payload);
    req.end();
  });
}

// ==========================================
// PUSH TO CLOUD (Aronium -> CRM)
// ==========================================
function fetchCustomersFromAronium() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(ARONIUM_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    const query = `SELECT Id, Name, Email, PhoneNumber, IsCustomer FROM Customer WHERE IsCustomer = 1`;
    db.all(query, [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function pushToCloud() {
  const customers = await fetchCustomersFromAronium();
  console.log(`[PUSH] Found ${customers.length} customers in local Aronium. Pushing to cloud...`);
  const result = await apiRequest('/api/sync/receive-aronium', 'POST', { customers });
  console.log(`[PUSH] Cloud Response [${result.status}]:`, result.data);
}

// ==========================================
// PULL FROM CLOUD (CRM -> Aronium)
// ==========================================
async function pullFromCloud() {
  console.log(`[PULL] Checking cloud for new CRM customers...`);
  const result = await apiRequest('/api/sync/send-aronium', 'GET');
  
  if (result.status !== 200) {
    console.error(`[PULL] Failed to fetch. Status: ${result.status}`, result.data);
    return;
  }
  
  const response = JSON.parse(result.data);
  const pendingCustomers = response.customers || [];
  
  if (pendingCustomers.length === 0) {
    console.log(`[PULL] No new customers in CRM to download.`);
    return;
  }
  
  console.log(`[PULL] Downloading ${pendingCustomers.length} new customers to Aronium...`);
  
  const db = new sqlite3.Database(ARONIUM_DB_PATH, sqlite3.OPEN_READWRITE);
  const confirmations = [];
  
  for (const cust of pendingCustomers) {
    try {
      const insertId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Customer (Name, Email, PhoneNumber, IsCustomer, IsSupplier) VALUES (?, ?, ?, 1, 0)`,
          [cust.name, cust.email || null, cust.phone || null],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      console.log(`   -> Added "${cust.name}" to Aronium POS with ID ${insertId}`);
      confirmations.push({ crmId: cust.id, aroniumId: insertId });
    } catch (err) {
      console.error(`   -> Failed to add "${cust.name}":`, err.message);
    }
  }
  
  db.close();
  
  if (confirmations.length > 0) {
    console.log(`[PULL] Confirming sync back to cloud...`);
    const confResult = await apiRequest('/api/sync/confirm-aronium', 'POST', { confirmations });
    console.log(`[PULL] Confirmation Response:`, confResult.data);
  }
}

// ==========================================
// MAIN SYNC LOOP
// ==========================================
async function runSync() {
  console.log(`\n[${new Date().toLocaleString()}] Starting Two-Way Sync...`);
  try {
    // 1. Push local changes to cloud
    await pushToCloud();
    // 2. Pull cloud changes to local
    await pullFromCloud();
  } catch (err) {
    console.error('❌ Sync Error:', err.message);
  }
}

// Run immediately, then run on interval
runSync();
setInterval(runSync, SYNC_INTERVAL_MINUTES * 60 * 1000);
