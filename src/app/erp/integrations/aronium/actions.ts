'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function saveAroniumConfig(formData: FormData) {
  const companyName = formData.get("companyName")?.toString() || "";
  const branchName = formData.get("branchName")?.toString() || "";
  const dbType = formData.get("dbType")?.toString() || "SQLITE";
  const dbPathOrHost = formData.get("dbPathOrHost")?.toString() || "";
  const portString = formData.get("port")?.toString();
  const port = portString ? parseInt(portString, 10) : null;
  const username = formData.get("username")?.toString() || null;
  const password = formData.get("password")?.toString() || null;
  const autoSync = formData.get("autoSync") === "on" || formData.get("autoSync") === "true";

  // Find the first configuration
  const existingConfig = await prisma.aroniumConfig.findFirst();

  if (existingConfig) {
    await prisma.aroniumConfig.update({
      where: { id: existingConfig.id },
      data: {
        companyName,
        branchName,
        dbType,
        dbPathOrHost,
        port,
        username,
        password,
        autoSync,
        status: "ONLINE", // Assuming setting it up sets status to ONLINE temporarily
      },
    });
  } else {
    await prisma.aroniumConfig.create({
      data: {
        companyName,
        branchName,
        dbType,
        dbPathOrHost,
        port,
        username,
        password,
        autoSync,
        status: "ONLINE",
      },
    });
  }

  revalidatePath("/erp/integrations/aronium");
}

export async function updateErpProduct(id: string, data: any) {
  await prisma.erpProduct.update({
    where: { id },
    data: {
      sellingPrice: parseFloat(data.sellingPrice) || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      currentStock: parseFloat(data.currentStock) || 0,
      reorderLevel: parseFloat(data.reorderLevel) || 0,
    },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function updateErpSale(id: string, data: any) {
  await prisma.erpSale.update({
    where: { id },
    data: {
      totalAmount: parseFloat(data.totalAmount) || 0,
      discount: parseFloat(data.discount) || 0,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
    },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function updateErpPurchase(id: string, data: any) {
  await prisma.erpPurchase.update({
    where: { id },
    data: {
      totalAmount: parseFloat(data.totalAmount) || 0,
      status: data.status,
    },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function deleteErpSale(id: string) {
  await prisma.erpSale.delete({
    where: { id },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function deleteErpPurchase(id: string) {
  await prisma.erpPurchase.delete({
    where: { id },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function triggerLocalSync() {
  try {
    const fs = require('fs');
    const sqlite3 = require('sqlite3').verbose();
    const crypto = require("crypto");

    const config = await prisma.aroniumConfig.findFirst();
    if (!config) throw new Error("Aronium config not found. Please setup first.");

    const dbPath = config.dbPathOrHost || "C:\\ProgramData\\Aronium\\Data\\pos.db";
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Aronium database not found at: ${dbPath}`);
    }

    const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!adminUser) throw new Error("No admin user found to assign records to.");
    const adminId = adminUser.id;

    // Connect to SQLite
    const db = await new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: any) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    const queryDB = (sql: string, params: any[] = []): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        (db as any).all(sql, params, (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    let salesCount = 0, purchasesCount = 0, productsCount = 0, customersCount = 0, vendorsCount = 0;

    // 1. Sync Customers (IsCustomer = 1)
    const customersRaw = await queryDB(`SELECT Id, Name, Code, PhoneNumber, Email, Address FROM Customer WHERE IsCustomer = 1`);
    for (const c of customersRaw) {
      if (!c.Name) continue;
      await prisma.customer.upsert({
        where: { aroniumId: c.Id.toString() },
        update: {
          name: c.Name,
          phone: c.PhoneNumber || "0000000000",
          email: c.Email || null,
          address: c.Address || null,
          lastSyncDate: new Date(),
          syncStatus: "SYNCED"
        },
        create: {
          name: c.Name,
          phone: c.PhoneNumber || "0000000000",
          email: c.Email || null,
          address: c.Address || null,
          aroniumId: c.Id.toString(),
          aroniumCode: c.Code,
          assignedToId: adminId,
          lastSyncDate: new Date(),
          syncStatus: "SYNCED",
          portalToken: crypto.randomBytes(16).toString("hex")
        }
      });
      customersCount++;
    }

    // 2. Sync Suppliers -> ErpVendor (IsSupplier = 1)
    const suppliersRaw = await queryDB(`SELECT Id, Name, Code, PhoneNumber, Email, Address FROM Customer WHERE IsSupplier = 1`);
    for (const v of suppliersRaw) {
      if (!v.Name) continue;
      const vendorId = v.Id.toString();
      const existingVendor = await prisma.erpVendor.findFirst({ where: { aroniumId: vendorId } });
      if (existingVendor) {
        await prisma.erpVendor.update({
          where: { id: existingVendor.id },
          data: {
            companyName: v.Name,
            phone: v.PhoneNumber,
            email: v.Email,
            address: v.Address
          }
        });
      } else {
        await prisma.erpVendor.create({
          data: {
            companyName: v.Name,
            phone: v.PhoneNumber,
            email: v.Email,
            address: v.Address,
            aroniumId: vendorId
          }
        });
      }
      vendorsCount++;
    }

    // 3. Sync Products -> ErpProduct
    const productsRaw = await queryDB(`SELECT Id, Name, Code, Price, Cost FROM Product`);
    for (const p of productsRaw) {
      if (!p.Name) continue;
      const pid = p.Id.toString();
      const existing = await prisma.erpProduct.findFirst({ where: { aroniumId: pid } });
      if (existing) {
        await prisma.erpProduct.update({
          where: { id: existing.id },
          data: {
            name: p.Name,
            sellingPrice: p.Price,
            purchasePrice: p.Cost
          }
        });
      } else {
        await prisma.erpProduct.create({
          data: {
            name: p.Name,
            sku: p.Code || pid,
            category: "Uncategorized",
            sellingPrice: p.Price,
            purchasePrice: p.Cost,
            aroniumId: pid
          }
        });
      }
      productsCount++;
    }

    // 4. Sync Sales (DocumentTypeId = 2) -> ErpIncome
    const salesRaw = await queryDB(`SELECT Id, Number, Date, Total, CustomerId FROM Document WHERE DocumentTypeId = 2`);
    for (const s of salesRaw) {
      const sid = s.Id.toString();
      const existing = await prisma.erpIncome.findFirst({ where: { aroniumId: sid } });
      
      const dt = new Date(s.Date);
      if (existing) {
        await prisma.erpIncome.update({
          where: { id: existing.id },
          data: {
            amount: s.Total,
            date: dt,
            title: \`Aronium Sale #\${s.Number}\`
          }
        });
      } else {
        await prisma.erpIncome.create({
          data: {
            incomeId: \`INC-\${s.Number}\`,
            date: dt,
            amount: s.Total,
            category: "Sales",
            paymentMethod: "CASH",
            title: \`Aronium Sale #\${s.Number}\`,
            aroniumId: sid,
            recordedById: adminId
          }
        });
      }
      salesCount++;
    }

    // 5. Sync Purchases (DocumentTypeId = 1) -> ErpExpense
    const purchaseRaw = await queryDB(`SELECT Id, Number, Date, Total, CustomerId FROM Document WHERE DocumentTypeId = 1`);
    for (const p of purchaseRaw) {
      const pid = p.Id.toString();
      const existing = await prisma.erpExpense.findFirst({ where: { aroniumId: pid } });
      
      // Attempt to map Vendor
      let vendorName = "Unknown Vendor";
      if (p.CustomerId) {
        const vid = p.CustomerId.toString();
        const foundV = await prisma.erpVendor.findFirst({ where: { aroniumId: vid } });
        if (foundV) vendorName = foundV.companyName;
      }

      const dt = new Date(p.Date);
      if (existing) {
        await prisma.erpExpense.update({
          where: { id: existing.id },
          data: {
            amount: p.Total,
            paymentDate: dt,
            title: \`Aronium Purchase #\${p.Number}\`,
            vendor: vendorName
          }
        });
      } else {
        await prisma.erpExpense.create({
          data: {
            title: \`Aronium Purchase #\${p.Number}\`,
            category: "Inventory Purchase",
            vendor: vendorName,
            amount: p.Total,
            paymentMethod: "CASH",
            paymentDate: dt,
            status: "PAID",
            aroniumId: pid,
            recordedById: adminId,
            approvedById: adminId
          }
        });
      }
      purchasesCount++;
    }

    // Close SQLite
    (db as any).close();

    // Log the sync
    await prisma.syncLog.create({
      data: {
        type: "NATIVE_FULL_SYNC",
        status: "SUCCESS",
        recordsAdded: salesCount + purchasesCount + customersCount + vendorsCount + productsCount,
        details: \`Native Sync via Server Action. Customers: \${customersCount}, Vendors: \${vendorsCount}, Products: \${productsCount}, Sales: \${salesCount}, Purchases: \${purchasesCount}.\`
      }
    });

    // Update config stats
    await prisma.aroniumConfig.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        totalSales: salesCount,
        totalProducts: productsCount,
        totalCustomers: customersCount
      }
    });

    revalidatePath("/erp/integrations/aronium");
    revalidatePath("/erp/dashboard");
    revalidatePath("/erp/finance/income");
    revalidatePath("/erp/finance/expense");
    revalidatePath("/erp/vendors");

    return { success: true };
  } catch (error: any) {
    console.error("Local sync error:", error);
    return { success: false, error: error.message || String(error) };
  }
}
