import sqlite3 from 'sqlite3';
import { prisma } from './prisma';

// Helper to wrap sqlite3 in promises
function queryAroniumDB(dbPath: string, query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    db.all(query, params, (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export async function syncCustomersFromAronium() {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings || !settings.aroniumDbPath) {
    throw new Error("Aronium DB path not configured.");
  }

  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) throw new Error("No admin user found to assign customers to.");

  // Aronium typically stores customers in a 'Customer' table
  // Columns usually include Id, Name, Email, PhoneNumber, etc.
  // Note: We'll query standard Aronium columns, but they might be named slightly differently depending on the version.
  const query = `SELECT Id, Name, Email, PhoneNumber, IsCustomer FROM Customer WHERE IsCustomer = 1`;
  
  let rows: any[] = [];
  try {
    rows = await queryAroniumDB(settings.aroniumDbPath, query);
  } catch (error: any) {
    throw new Error(`Failed to read Aronium database: ${error.message}`);
  }

  let recordsAdded = 0;
  let recordsUpdated = 0;

  for (const row of rows) {
    const aroniumId = row.Id.toString();
    const name = row.Name;
    if (!name) continue;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { aroniumId: aroniumId },
          { name: name }
        ]
      }
    });

    if (existingCustomer) {
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          aroniumId: aroniumId,
          syncStatus: "SYNCED",
          lastSyncDate: new Date()
        }
      });
      recordsUpdated++;
    } else {
      await prisma.customer.create({
        data: {
          name: name,
          phone: row.PhoneNumber || "0000000000",
          email: row.Email || null,
          aroniumId: aroniumId,
          syncStatus: "SYNCED",
          lastSyncDate: new Date(),
          assignedToId: adminUser.id,
          status: "ACTIVE"
        }
      });
      recordsAdded++;
    }
  }

  await prisma.syncLog.create({
    data: {
      type: "CUSTOMER_AUTO",
      status: "SUCCESS",
      recordsAdded,
      details: `Auto-synced from Aronium DB. Added: ${recordsAdded}, Updated: ${recordsUpdated}.`
    }
  });

  return { added: recordsAdded, updated: recordsUpdated };
}

// Write Helper
function executeAroniumDB(dbPath: string, query: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) return reject(err);
    });

    db.run(query, params, function(err) {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function insertCustomerToAronium(name: string, phone: string, email: string) {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings || !settings.aroniumDbPath) {
    throw new Error("Aronium DB path not configured.");
  }

  // Best-effort insertion for typical Aronium Free local SQLite schema
  // We don't provide Id because Aronium either uses AUTOINCREMENT or triggers to generate it
  // We supply required fields
  const query = `
    INSERT INTO Customer (Name, PhoneNumber, Email, IsCustomer, IsSupplier, IsEnabled, DateCreated, DateUpdated)
    VALUES (?, ?, ?, 1, 0, 1, datetime('now'), datetime('now'))
  `;
  
  try {
    await executeAroniumDB(settings.aroniumDbPath, query, [
      name || 'Unknown Lead',
      phone || '',
      email || ''
    ]);
    return true;
  } catch (error: any) {
    console.error("Failed to write to Aronium DB:", error);
    // If it fails (e.g., Schema mismatch), we fail gracefully so the CRM conversion still succeeds
    return false;
  }
}
