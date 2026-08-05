/**
 * Aronium Hybrid-Cloud Sync Engine - Local Agent
 * 
 * This script securely syncs your local Aronium POS data to the cloud CRM.
 * 
 * Prerequisites:
 * 1. Install Node.js (https://nodejs.org)
 * 2. Run the following command in the same directory as this script:
 *    npm install sqlite3
 * 
 * Usage:
 * Run this script locally using the command:
 *    node aronium-sync-agent.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const https = require('https');
const http = require('http'); // Fallback if API_URL is HTTP

// ==========================================
// CONFIGURATION
// ==========================================

// Replace these with your actual cloud CRM details
const API_URL = 'http://127.0.0.1:3000/api/erp/aronium/sync'; // Change to your Vercel URL if hosted externally
const SYNC_TOKEN = 'cmryxkiut00011bl7266snr40'; 

// Provide the correct path to your aronium.db file
// Default path on Windows is often: 'C:\\ProgramData\\Aronium\\Data\\aronium.db'
const DB_PATH = 'C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db'; 

// ==========================================

if (!fs.existsSync(DB_PATH)) {
    console.error(`[ERROR] Aronium database not found at: ${DB_PATH}`);
    console.error('Please update the DB_PATH variable in this script if your installation is elsewhere.');
    process.exit(1);
}

// Connect to the SQLite Database
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('[ERROR] Could not connect to database', err.message);
        process.exit(1);
    }
    console.log('[INFO] Connected to the local Aronium database.');
});

/**
 * Fetches data from SQLite and returns it as a Promise
 */
const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * Syncs the provided data payload to the Cloud CRM
 */
const syncToCloud = (type, data) => {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ type, data });
        // Handle potentially missing protocol in API_URL by defaulting to http for local dev
        let finalUrl = API_URL;
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            console.warn('[WARN] API_URL missing protocol. Defaulting to https://');
            finalUrl = 'https://' + finalUrl;
        }

        let url;
        try {
            url = new URL(finalUrl);
        } catch (e) {
            console.error('[ERROR] Invalid API_URL format:', API_URL);
            reject(e);
            return;
        }

        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SYNC_TOKEN}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`[SUCCESS] Synced ${data.length} ${type} to Cloud.`);
                    resolve(responseBody);
                } else {
                    console.error(`[ERROR] Sync failed for ${type}. Status: ${res.statusCode} - ${responseBody}`);
                    reject(new Error(responseBody));
                }
            });
        });

        req.on('error', (err) => {
            console.error(`[ERROR] Network error while syncing ${type}:`, err.message);
            reject(err);
        });

        req.write(payload);
        req.end();
    });
};

const runSync = async () => {
    try {
        console.log('[INFO] Starting sync process...');

        // 1. Fetch & Sync Products
        console.log('[INFO] Fetching Products...');
        // Querying Aronium's local SQLite database
        const productsRaw = await queryDB(`
            SELECT 
                Id as aroniumId, 
                Name as name, 
                Code as sku, 
                Price as sellingPrice, 
                Cost as purchasePrice
            FROM Product
            LIMIT 1000
        `);
        // Map data to expected format for CRM
        const productsPayload = productsRaw.map(p => ({
            ...p,
            category: 'Uncategorized', // Update logic if joining with Group table
            brand: 'N/A',
            reorderLevel: 5
        }));
        
        if (productsPayload.length > 0) {
            await syncToCloud('PRODUCTS', productsPayload);
        } else {
            console.log('[INFO] No products to sync.');
        }

        // 2. Fetch & Sync Customers
        console.log('[INFO] Fetching Customers...');
        const customersRaw = await queryDB(`
            SELECT 
                Id as aroniumId, 
                Name as name, 
                Code as aroniumCode, 
                PhoneNumber as phone, 
                Email as email, 
                Address as address 
            FROM Customer
            LIMIT 1000
        `);
        if (customersRaw.length > 0) {
            await syncToCloud('CUSTOMERS', customersRaw);
        } else {
            console.log('[INFO] No customers to sync.');
        }

        // 3. Fetch & Sync Sales
        console.log('[INFO] Fetching Sales...');
        const salesRaw = await queryDB(`
            SELECT 
                Id as aroniumId, 
                Number as invoiceNumber, 
                Date as date, 
                Total as totalAmount, 
                Discount as discount, 
                CustomerId as customerId
            FROM Document
            WHERE DocumentTypeId = 2 -- DocumentTypeId 2 is for Sales
            ORDER BY Date DESC
            LIMIT 500
        `);
        
        const salesPayload = salesRaw.map(s => ({
            ...s,
            gst: 0,
            paymentMethod: 'CASH',
            paymentStatus: 'PAID'
        }));
        
        if (salesPayload.length > 0) {
            await syncToCloud('SALES', salesPayload);
        } else {
            console.log('[INFO] No sales to sync.');
        }

        // 4. Fetch & Sync Purchases
        console.log('[INFO] Fetching Purchases...');
        const purchasesRaw = await queryDB(`
            SELECT 
                Id as aroniumId, 
                Number as orderNumber, 
                Date as date, 
                Total as totalAmount, 
                CustomerId as vendorId
            FROM Document
            WHERE DocumentTypeId = 1 -- DocumentTypeId 1 is for Purchases
            ORDER BY Date DESC
            LIMIT 500
        `);
        
        const purchasesPayload = purchasesRaw.map(p => ({
            ...p,
            status: 'PAID'
        }));
        
        if (purchasesPayload.length > 0) {
            await syncToCloud('PURCHASES', purchasesPayload);
        } else {
            console.log('[INFO] No purchases to sync.');
        }

        console.log('[INFO] Sync process completed successfully.');
    } catch (error) {
        console.error('[FATAL] Sync process aborted due to error.', error.message);
    } finally {
        db.close();
        console.log('[INFO] Database connection closed.');
    }
};

// Start the Sync Engine
runSync();
