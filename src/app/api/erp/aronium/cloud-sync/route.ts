export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customers, suppliers, products, sales, purchases } = await req.json();

    const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!adminUser) throw new Error("No admin user found to assign records to.");
    const adminId = adminUser.id;

    let salesCount = 0, purchasesCount = 0, productsCount = 0, customersCount = 0, vendorsCount = 0;

    // 1. Sync Customers
    if (customers && Array.isArray(customers)) {
      for (const c of customers) {
        if (!c.Name) continue;
        const aroniumIdStr = c.Id.toString();
        const existingCustomer = await prisma.customer.findFirst({ where: { aroniumId: aroniumIdStr } });
        
        if (existingCustomer) {
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: c.Name,
              phone: c.PhoneNumber || "0000000000",
              email: c.Email || null,
              address: c.Address || null,
              lastSyncDate: new Date(),
              syncStatus: "SYNCED"
            }
          });
        } else {
          await prisma.customer.create({
            data: {
              name: c.Name,
              phone: c.PhoneNumber || "0000000000",
              email: c.Email || null,
              address: c.Address || null,
              aroniumId: aroniumIdStr,
              aroniumCode: c.Code,
              assignedToId: adminId,
              lastSyncDate: new Date(),
              syncStatus: "SYNCED",
              portalToken: crypto.randomBytes(16).toString("hex")
            }
          });
        }
        customersCount++;
      }
    }

    // 2. Sync Suppliers -> ErpVendor
    if (suppliers && Array.isArray(suppliers)) {
      for (const v of suppliers) {
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
    }

    // 3. Sync Products -> ErpProduct
    if (products && Array.isArray(products)) {
      for (const p of products) {
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
    }

    // 4. Sync Sales -> ErpIncome
    if (sales && Array.isArray(sales)) {
      for (const s of sales) {
        const sid = s.Id.toString();
        const existing = await prisma.erpIncome.findFirst({ where: { aroniumId: sid } });
        
        const dt = new Date(s.Date);
        if (existing) {
          await prisma.erpIncome.update({
            where: { id: existing.id },
            data: {
              amount: s.Total,
              date: dt,
              notes: \`Aronium Sale #\${s.Number}\`
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
              notes: \`Aronium Sale #\${s.Number}\`,
              aroniumId: sid,
              recordedById: adminId
            }
          });
        }
        salesCount++;
      }
    }

    // 5. Sync Purchases -> ErpExpense
    if (purchases && Array.isArray(purchases)) {
      for (const p of purchases) {
        const pid = p.Id.toString();
        const existing = await prisma.erpExpense.findFirst({ where: { aroniumId: pid } });
        
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
    }

    // Log the sync
    await prisma.syncLog.create({
      data: {
        type: "CLOUD_SYNC_WEBHOOK",
        status: "SUCCESS",
        recordsAdded: salesCount + purchasesCount + customersCount + vendorsCount + productsCount,
        details: \`Cloud Sync Received. Customers: \${customersCount}, Vendors: \${vendorsCount}, Products: \${productsCount}, Sales: \${salesCount}, Purchases: \${purchasesCount}.\`
      }
    });

    const config = await prisma.aroniumConfig.findFirst();
    if (config) {
      await prisma.aroniumConfig.update({
        where: { id: config.id },
        data: {
          lastSyncAt: new Date(),
          totalSales: salesCount,
          totalProducts: productsCount,
          totalCustomers: customersCount
        }
      });
    }

    return NextResponse.json({ success: true, salesCount, purchasesCount, productsCount, customersCount, vendorsCount });

  } catch (error: any) {
    console.error("Cloud sync webhook error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
