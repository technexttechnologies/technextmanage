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

    const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } }) || await prisma.user.findFirst();
    if (!adminUser) throw new Error("No admin user found to assign records to.");
    const adminId = adminUser.id;

    let salesCount = 0, purchasesCount = 0, productsCount = 0, customersCount = 0, vendorsCount = 0;

    // 1. Sync Customers
    if (customers && Array.isArray(customers)) {
      for (const c of customers) {
        if (!c.Name) continue;
        const aroniumIdStr = c.Id ? c.Id.toString() : null;
        if (!aroniumIdStr) continue;

        let existingCustomer = await prisma.customer.findFirst({ where: { aroniumId: aroniumIdStr } });
        if (!existingCustomer && c.PhoneNumber && c.PhoneNumber !== '0000000000') {
          existingCustomer = await prisma.customer.findFirst({ where: { phone: c.PhoneNumber } });
        }
        if (!existingCustomer && c.Name) {
          existingCustomer = await prisma.customer.findFirst({ where: { name: c.Name } });
        }
        
        if (existingCustomer) {
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: c.Name,
              phone: (c.PhoneNumber && c.PhoneNumber !== '0000000000') ? c.PhoneNumber : existingCustomer.phone,
              email: c.Email || existingCustomer.email,
              address: c.Address || existingCustomer.address,
              aroniumId: aroniumIdStr,
              aroniumCode: c.Code || existingCustomer.aroniumCode,
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
        const vendorId = v.Id ? v.Id.toString() : null;
        if (!vendorId) continue;

        let existingVendor = await prisma.erpVendor.findFirst({ where: { aroniumId: vendorId } });
        if (!existingVendor && v.Name) {
          existingVendor = await prisma.erpVendor.findFirst({ where: { companyName: v.Name } });
        }

        if (existingVendor) {
          await prisma.erpVendor.update({
            where: { id: existingVendor.id },
            data: {
              companyName: v.Name,
              phone: v.PhoneNumber || existingVendor.phone,
              email: v.Email || existingVendor.email,
              address: v.Address || existingVendor.address,
              aroniumId: vendorId
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
        const pid = p.Id ? p.Id.toString() : null;
        if (!pid) continue;

        const currentStock = parseFloat(p.CurrentStock !== undefined ? p.CurrentStock : p.currentStock) || 0;
        const reorderLevel = 5;
        const isLowStock = currentStock < reorderLevel;
        const sellingPrice = parseFloat(p.Price !== undefined ? p.Price : p.sellingPrice) || 0;
        const purchasePrice = parseFloat(p.Cost !== undefined ? p.Cost : p.purchasePrice) || 0;
        const barcode = p.Barcode || p.barcode || null;
        const sku = p.Code || p.sku || pid;

        const existing = await prisma.erpProduct.findFirst({ where: { aroniumId: pid } });
        if (existing) {
          await prisma.erpProduct.update({
            where: { id: existing.id },
            data: {
              name: p.Name,
              sku,
              barcode: barcode || existing.barcode,
              sellingPrice,
              purchasePrice,
              currentStock,
              reorderLevel,
              isLowStock
            }
          });
        } else {
          await prisma.erpProduct.create({
            data: {
              name: p.Name,
              sku,
              barcode,
              category: "Uncategorized",
              sellingPrice,
              purchasePrice,
              currentStock,
              reorderLevel,
              isLowStock,
              aroniumId: pid
            }
          });
        }
        productsCount++;
      }
    }

    // 4. Sync Sales -> ErpSale & ErpIncome
    if (sales && Array.isArray(sales)) {
      for (const s of sales) {
        const sid = s.Id ? s.Id.toString() : null;
        if (!sid) continue;

        const dt = new Date(s.Date);
        const totalAmount = parseFloat(s.Total) || 0;
        const discount = parseFloat(s.Discount) || 0;
        const paymentMethod = s.PaymentMethod || 'CASH';
        const invoiceNumber = s.Number || `INV-${sid}`;

        // 4a. Sync to ErpSale (Aronium Integration Dashboard)
        const existingSale = await prisma.erpSale.findUnique({
          where: { aroniumId: sid }
        });

        if (existingSale) {
          await prisma.erpSale.update({
            where: { id: existingSale.id },
            data: {
              invoiceNumber,
              date: dt,
              totalAmount,
              discount,
              paymentMethod,
              paymentStatus: "PAID",
              branch: "Main Branch",
              salesperson: s.CustomerName || null
            }
          });
        } else {
          await prisma.erpSale.create({
            data: {
              aroniumId: sid,
              invoiceNumber,
              date: dt,
              totalAmount,
              discount,
              paymentMethod,
              paymentStatus: "PAID",
              branch: "Main Branch",
              salesperson: s.CustomerName || null
            }
          });
        }

        // 4b. Sync to ErpIncome (Financial Ledger)
        const existingIncome = await prisma.erpIncome.findFirst({ where: { aroniumId: sid } });
        if (existingIncome) {
          await prisma.erpIncome.update({
            where: { id: existingIncome.id },
            data: {
              amount: totalAmount,
              date: dt,
              paymentMethod,
              notes: `Aronium Sale #${invoiceNumber}${s.CustomerName ? ' - ' + s.CustomerName : ''}`
            }
          });
        } else {
          await prisma.erpIncome.create({
            data: {
              incomeId: `INC-${invoiceNumber}`,
              date: dt,
              amount: totalAmount,
              category: "Aronium Sales",
              paymentMethod,
              notes: `Aronium Sale #${invoiceNumber}${s.CustomerName ? ' - ' + s.CustomerName : ''}`,
              aroniumId: sid,
              recordedById: adminId
            }
          });
        }
        salesCount++;
      }
    }

    // 5. Sync Purchases -> ErpPurchase & ErpExpense
    if (purchases && Array.isArray(purchases)) {
      for (const p of purchases) {
        const pid = p.Id ? p.Id.toString() : null;
        if (!pid) continue;

        const dt = new Date(p.Date);
        const totalAmount = parseFloat(p.Total) || 0;
        const orderNumber = p.Number || `PUR-${pid}`;

        let vendorName = p.VendorName || "Unknown Vendor";
        if (!p.VendorName && p.CustomerId) {
          const vid = p.CustomerId.toString();
          const foundV = await prisma.erpVendor.findFirst({ where: { aroniumId: vid } });
          if (foundV) vendorName = foundV.companyName;
        }

        // 5a. Sync to ErpPurchase (Aronium Integration Dashboard)
        const existingPurchase = await prisma.erpPurchase.findUnique({
          where: { aroniumId: pid }
        });

        if (existingPurchase) {
          await prisma.erpPurchase.update({
            where: { id: existingPurchase.id },
            data: {
              orderNumber,
              date: dt,
              totalAmount,
              status: "PAID"
            }
          });
        } else {
          await prisma.erpPurchase.create({
            data: {
              aroniumId: pid,
              orderNumber,
              date: dt,
              totalAmount,
              status: "PAID"
            }
          });
        }

        // 5b. Sync to ErpExpense (Financial Ledger)
        const existingExpense = await prisma.erpExpense.findFirst({ where: { aroniumId: pid } });
        if (existingExpense) {
          await prisma.erpExpense.update({
            where: { id: existingExpense.id },
            data: {
              amount: totalAmount,
              paymentDate: dt,
              title: `Aronium Purchase #${orderNumber}`,
              vendor: vendorName
            }
          });
        } else {
          await prisma.erpExpense.create({
            data: {
              title: `Aronium Purchase #${orderNumber}`,
              category: "Inventory Purchase",
              vendor: vendorName,
              amount: totalAmount,
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
        details: `Cloud Sync Received. Customers: ${customersCount}, Vendors: ${vendorsCount}, Products: ${productsCount}, Sales: ${salesCount}, Purchases: ${purchasesCount}.`
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
          totalCustomers: customersCount,
          status: "ONLINE"
        }
      });
    }

    try {
      revalidatePath('/erp/integrations/aronium');
      revalidatePath('/erp');
      revalidatePath('/crm/customers');
    } catch {
      // Background revalidation
    }

    return NextResponse.json({ success: true, salesCount, purchasesCount, productsCount, customersCount, vendorsCount });

  } catch (error: any) {
    console.error("Cloud sync webhook error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

