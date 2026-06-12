import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dbPath = './prisma/dev.db';

// Helper to query sqlite
function querySqlite(query) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });
    db.all(query, [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function migrate() {
  console.log("Starting Data Migration from dev.db to Neon Postgres...");
  try {
    // 1. Migrate User
    const users = await querySqlite("SELECT * FROM User");
    console.log(`Found ${users.length} users.`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role },
        create: { id: u.id, name: u.name, email: u.email, role: u.role, passwordHash: u.passwordHash, createdAt: new Date(u.createdAt) }
      });
    }

    // 2. Migrate SystemSettings
    const settings = await querySqlite("SELECT * FROM SystemSettings");
    console.log(`Found ${settings.length} system settings.`);
    for (const s of settings) {
      const existing = await prisma.systemSettings.findFirst();
      if (existing) {
        await prisma.systemSettings.update({
          where: { id: existing.id },
          data: {
            aroniumDbPath: s.aroniumDbPath,
            geminiApiKey: s.geminiApiKey,
            gmailUser: s.gmailUser,
            gmailPass: s.gmailPass
          }
        });
      } else {
        await prisma.systemSettings.create({
          data: {
            aroniumDbPath: s.aroniumDbPath,
            geminiApiKey: s.geminiApiKey,
            gmailUser: s.gmailUser,
            gmailPass: s.gmailPass
          }
        });
      }
    }

    // 3. Migrate MessageTemplates
    const templates = await querySqlite("SELECT * FROM MessageTemplate");
    console.log(`Found ${templates.length} templates.`);
    for (const t of templates) {
      await prisma.messageTemplate.upsert({
        where: { id: t.id },
        update: { name: t.name, body: t.body, type: t.type, variables: t.variables },
        create: { id: t.id, name: t.name, body: t.body, type: t.type, variables: t.variables, createdAt: new Date(t.createdAt) }
      });
    }

    // Get the first user to assign records to
    const adminUser = await prisma.user.findFirst();

    // 4. Migrate Customers
    const customers = await querySqlite("SELECT * FROM Customer");
    console.log(`Found ${customers.length} customers.`);
    for (const c of customers) {
      await prisma.customer.upsert({
        where: { id: c.id },
        update: { name: c.name, company: c.company, email: c.email, phone: c.phone, aroniumId: c.aroniumId, syncStatus: c.syncStatus },
        create: {
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone,
          status: c.status,
          assignedToId: adminUser?.id || c.assignedToId,
          aroniumId: c.aroniumId,
          syncStatus: c.syncStatus,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }
      });
    }

    // 5. Migrate Leads
    const leads = await querySqlite("SELECT * FROM Lead");
    console.log(`Found ${leads.length} leads.`);
    for (const l of leads) {
      await prisma.lead.upsert({
        where: { id: l.id },
        update: { name: l.name, email: l.email, phone: l.phone, status: l.status },
        create: {
          id: l.id,
          name: l.name,
          company: l.company,
          email: l.email,
          phone: l.phone,
          status: l.status,
          source: l.source,
          notes: l.notes,
          assignedToId: adminUser?.id || l.assignedToId,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt)
        }
      });
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
