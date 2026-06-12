const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const http = require('http');

// ==========================================
// CONFIGURATION - CHANGE THESE SETTINGS
// ==========================================
const ARONIUM_DB_PATH = 'C:\\Program Files\\Aronium\\Data\\aronium.db'; // Update to exact path
const VERCEL_APP_URL = 'https://technextmanage.vercel.app'; // Your Vercel URL
const SYNC_SECRET = 'technext-sync-2026';
const SYNC_INTERVAL_MINUTES = 30;
// ==========================================

console.log('🚀 TechNext Aronium Push Agent Started');
console.log(`Syncing every ${SYNC_INTERVAL_MINUTES} minutes...`);

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

async function pushToCloud(customers) {
  const payload = JSON.stringify({ customers });
  const url = new URL(`${VERCEL_APP_URL}/api/sync/receive-aronium`);
  const reqModule = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SYNC_SECRET}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = reqModule.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', error => reject(error));
    req.write(payload);
    req.end();
  });
}

async function runSync() {
  console.log(`[${new Date().toLocaleString()}] Starting sync...`);
  try {
    const customers = await fetchCustomersFromAronium();
    console.log(`Found ${customers.length} customers in local Aronium. Pushing to cloud...`);
    
    const result = await pushToCloud(customers);
    console.log(`Cloud Response [${result.status}]:`, result.data);
  } catch (err) {
    console.error('❌ Sync Error:', err.message);
  }
}

// Run immediately, then run on interval
runSync();
setInterval(runSync, SYNC_INTERVAL_MINUTES * 60 * 1000);
