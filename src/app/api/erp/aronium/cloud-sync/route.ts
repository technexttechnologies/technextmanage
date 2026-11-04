export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { findExistingCustomer } from "@/lib/customerDedup";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customers, suppliers, products, sales, purchases, proformas } = await req.json();

    const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } }) || await prisma.user.findFirst();
    if (!adminUser) throw new Error("No admin user found to assign records to.");
    const adminId = adminUser.id;

    let salesCount = 0, purchasesCount = 0, productsCount = 0, customersCount = 0, vendorsCount = 0, proformasCount = 0;

    // 1. Sync Customers
    if (customers && Array.isArray(customers)) {
      for (const c of customers) {
        if (!c.Name) continue;
        const aroniumIdStr = c.Id ? c.Id.toString() : null;
        if (!aroniumIdStr) continue;

        let existingCustomer = await findExistingCustomer({
          aroniumId: aroniumIdStr,
          phone: c.PhoneNumber,
          email: c.Email,
          name: c.Name
        });
        
        if (existingCustomer) {
          const cleanPhone = c.PhoneNumber ? c.PhoneNumber.replace(/\s+/g, '') : '';
          const shouldUpdateAroniumId = !existingCustomer.aroniumId || existingCustomer.aroniumId === aroniumIdStr;

          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              ...(shouldUpdateAroniumId ? { aroniumId: aroniumIdStr, aroniumCode: c.Code || existingCustomer.aroniumCode } : {}),
              phone: (cleanPhone && cleanPhone !== '0000000000') ? cleanPhone : existingCustomer.phone,
              email: existingCustomer.email || c.Email,
              address: existingCustomer.address || c.Address,
              lastSyncDate: new Date(),
              syncStatus: "SYNCED"
            }
          });
        } else {
          const cleanPhone = c.PhoneNumber ? c.PhoneNumber.replace(/\s+/g, '') : "0000000000";
          await prisma.customer.create({
            data: {
              name: c.Name,
              phone: cleanPhone || "0000000000",
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
        const cleanVendorPhone = v.PhoneNumber ? v.PhoneNumber.replace(/\D/g, '') : '';
        if (!existingVendor && cleanVendorPhone.length >= 8 && cleanVendorPhone !== '0000000000') {
          existingVendor = await prisma.erpVendor.findFirst({
            where: {
              phone: { contains: cleanVendorPhone.slice(-10) }
            }
          });
        }
        if (!existingVendor && v.Name) {
          existingVendor = await prisma.erpVendor.findFirst({
            where: {
              companyName: { equals: v.Name.trim(), mode: 'insensitive' }
            }
          });
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

    // 3. Sync Products -> ErpProduct (with Groups/Categories & Measurement Units)
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
        const category = p.GroupName || p.category || "General";
        const unit = p.MeasurementUnit || p.unit || (category.toLowerCase().includes('website') ? 'WEBSITE' : 'Pcs');
        const isService = unit.toUpperCase().includes('SERV') || unit.toUpperCase().includes('PACKAGE') || unit.toUpperCase().includes('WEBSITE') || unit.toUpperCase().includes('SOFTWARE');

        const existing = await prisma.erpProduct.findFirst({
          where: {
            OR: [
              { aroniumId: pid },
              { sku: sku }
            ]
          }
        });

        if (existing) {
          await prisma.erpProduct.update({
            where: { id: existing.id },
            data: {
              name: p.Name,
              sku,
              barcode: barcode || existing.barcode,
              category,
              unit,
              sellingPrice,
              purchasePrice,
              currentStock,
              reorderLevel,
              isLowStock,
              isService,
              aroniumId: pid
            }
          });
        } else {
          await prisma.erpProduct.create({
            data: {
              name: p.Name,
              sku,
              barcode,
              category,
              unit,
              sellingPrice,
              purchasePrice,
              currentStock,
              reorderLevel,
              isLowStock,
              isService,
              aroniumId: pid
            }
          });
        }
        productsCount++;
      }
    }

    // 4. Sync Sales -> ErpSale, ErpIncome & InvoiceRequest (with Line Items & Split Payments)
    if (sales && Array.isArray(sales)) {
      for (const s of sales) {
        const sid = s.Id ? s.Id.toString() : null;
        if (!sid) continue;

        const dt = new Date(s.Date);
        const totalAmount = parseFloat(s.Total) || 0;
        const discount = parseFloat(s.Discount) || 0;
        const invoiceNumber = s.Number || `INV-${sid}`;

        const docPayments = Array.isArray(s.payments) ? s.payments : [];
        const paidFromPayments = docPayments.reduce((acc: number, p: any) => acc + (parseFloat(p.Amount) || 0), 0);
        const paidAmount = docPayments.length > 0 ? paidFromPayments : (s.PaidStatus === 2 ? totalAmount : 0);
        const amountDue = Math.max(0, totalAmount - paidAmount);
        const isPaid = s.PaidStatus === 2 || (paidAmount >= totalAmount && totalAmount > 0);

        const paymentMethod = docPayments.length > 1
          ? 'SPLIT / MULTI-DATE'
          : (s.PaymentMethod || docPayments[0]?.PaymentTypeName || 'CASH');

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
              paymentStatus: isPaid ? "PAID" : "PENDING",
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
              paymentStatus: isPaid ? "PAID" : "PENDING",
              branch: "Main Branch",
              salesperson: s.CustomerName || null
            }
          });
        }

        // 4b. Sync to ErpIncome (Financial Ledger)
        const existingIncome = await prisma.erpIncome.findFirst({
          where: {
            OR: [
              { aroniumId: sid },
              { incomeId: `INC-${invoiceNumber}` }
            ]
          }
        });
        if (existingIncome) {
          await prisma.erpIncome.update({
            where: { id: existingIncome.id },
            data: {
              amount: totalAmount,
              date: dt,
              paymentMethod,
              aroniumId: sid,
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

        // 4c. Sync to InvoiceRequest (Aronium Billing Console)
        let customerPrisma = s.CustomerId ? await prisma.customer.findFirst({
          where: {
            OR: [
              { aroniumId: s.CustomerId.toString() },
              s.CustomerName ? { name: { equals: s.CustomerName.trim(), mode: 'insensitive' } } : undefined
            ].filter(Boolean) as any
          }
        }) : null;

        if (customerPrisma) {
          const docItems = Array.isArray(s.items) ? s.items : [];
          const structuredItems = docItems.map((it: any, idx: number) => ({
            id: `aronium-item-${it.Id || idx + 1}`,
            code: it.ProductCode || `SKU-${it.ProductId}`,
            name: it.ProductName || 'Product Item',
            unit: it.MeasurementUnit || 'Pcs',
            quantity: parseFloat(it.Quantity) || 1,
            unitPrice: parseFloat(it.Price) || 0,
            priceBeforeTax: parseFloat(it.PriceBeforeTax || it.Price) || 0,
            tax: '0%',
            discount: parseFloat(it.Discount) > 0 ? (it.DiscountType === 1 ? `₹${it.Discount}` : `${it.Discount}%`) : '---',
            totalBeforeDiscount: (parseFloat(it.Quantity) || 1) * (parseFloat(it.Price) || 0),
            total: parseFloat(it.Total) || 0
          }));

          const paymentSchedule = docPayments.map((p: any) => ({
            date: p.Date ? p.Date.split(' ')[0] : s.Date.split(' ')[0],
            amount: parseFloat(p.Amount) || 0,
            method: p.PaymentTypeName || p.paymentType || 'CASH'
          }));

          const isRefundDoc = s.isRefund || totalAmount < 0 || invoiceNumber.includes('220-');
          const docType = isRefundDoc ? 'REFUND' : 'INVOICE';

          const structuredData = {
            documentNumber: invoiceNumber,
            documentType: docType,
            date: s.Date ? s.Date.split(' ')[0] : new Date().toISOString().split('T')[0],
            dueDate: s.Date ? s.Date.split(' ')[0] : new Date().toISOString().split('T')[0],
            totalAmount: totalAmount,
            subtotal: totalAmount,
            paidAmount: isRefundDoc ? Math.abs(totalAmount) : paidAmount,
            amountDue: isRefundDoc ? 0 : amountDue,
            paymentStatus: isRefundDoc ? 'Refunded' : (isPaid ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending')),
            paymentMethod: paymentMethod,
            paymentSchedule: paymentSchedule,
            items: structuredItems,
            scopeOfWork: isRefundDoc ? `Aronium POS Refund Document #${invoiceNumber}` : `Aronium POS Document #${invoiceNumber}`
          };

          const existingInv = await prisma.invoiceRequest.findFirst({
            where: { aroniumInvoiceNo: invoiceNumber }
          });

          if (existingInv) {
            await prisma.invoiceRequest.update({
              where: { id: existingInv.id },
              data: {
                customerId: customerPrisma.id,
                amountRequested: totalAmount,
                subtotal: totalAmount,
                status: isRefundDoc ? 'PAID' : (isPaid ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY_PAID' : 'INVOICE_GENERATED')),
                structuredData: structuredData,
                notes: isRefundDoc ? `Aronium POS Refund #${invoiceNumber}` : `Aronium POS Sales Invoice #${invoiceNumber}`,
                createdAt: dt
              }
            });
          } else {
            await prisma.invoiceRequest.create({
              data: {
                customerId: customerPrisma.id,
                amountRequested: totalAmount,
                subtotal: totalAmount,
                aroniumInvoiceNo: invoiceNumber,
                status: isRefundDoc ? 'PAID' : (isPaid ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY_PAID' : 'INVOICE_GENERATED')),
                requestedById: adminId,
                assignedAdminId: adminId,
                structuredData: structuredData,
                notes: isRefundDoc ? `Aronium POS Refund #${invoiceNumber}` : `Aronium POS Sales Invoice #${invoiceNumber}`,
                createdAt: dt
              }
            });
          }
        }

        salesCount++;
      }
    }

    // 5. Sync Proformas -> Quotations & QuotationItems
    if (proformas && Array.isArray(proformas)) {
      for (const pf of proformas) {
        if (!pf.Number) continue;

        let customerPrisma = pf.CustomerId ? await prisma.customer.findFirst({
          where: {
            OR: [
              { aroniumId: pf.CustomerId.toString() },
              pf.CustomerName ? { name: { equals: pf.CustomerName.trim(), mode: 'insensitive' } } : undefined
            ].filter(Boolean) as any
          }
        }) : null;

        if (!customerPrisma) continue;

        const pfDate = new Date(pf.Date || Date.now());
        const totalAmount = parseFloat(pf.Total) || 0;
        const pfItems = Array.isArray(pf.items) ? pf.items : [];
        const subtotal = pfItems.reduce((acc: number, it: any) => acc + (parseFloat(it.Total) || (parseFloat(it.Quantity) * parseFloat(it.Price)) || 0), 0);

        const existingQuote = await prisma.quotation.findUnique({
          where: { quotationNumber: pf.Number }
        });

        let quoteId = existingQuote?.id;

        if (existingQuote) {
          await prisma.quotation.update({
            where: { id: quoteId },
            data: {
              customerId: customerPrisma.id,
              date: pfDate,
              createdAt: pfDate,
              totalAmount: totalAmount,
              subtotal: subtotal,
              status: pf.PaidStatus === 2 ? 'APPROVED' : (pf.PaidStatus === 1 ? 'SENT' : 'DRAFT'),
              notes: `Aronium Proforma #${pf.Number} - ${pf.CustomerName || ''}`
            }
          });
          await prisma.quotationItem.deleteMany({ where: { quotationId: quoteId } });
        } else {
          const createdQuote = await prisma.quotation.create({
            data: {
              quotationNumber: pf.Number,
              customerId: customerPrisma.id,
              date: pfDate,
              createdAt: pfDate,
              totalAmount: totalAmount,
              subtotal: subtotal,
              status: pf.PaidStatus === 2 ? 'APPROVED' : (pf.PaidStatus === 1 ? 'SENT' : 'DRAFT'),
              notes: `Aronium Proforma #${pf.Number} - ${pf.CustomerName || ''}`,
              assignedToId: adminId
            }
          });
          quoteId = createdQuote.id;
        }

        for (const it of pfItems) {
          await prisma.quotationItem.create({
            data: {
              quotationId: quoteId!,
              name: it.ProductName || 'Service / Product Item',
              description: `Code: ${it.ProductCode || it.ProductId} | Unit: ${it.MeasurementUnit || 'Pcs'}`,
              quantity: Math.max(1, parseInt(it.Quantity) || 1),
              price: parseFloat(it.Price) || 0,
              total: parseFloat(it.Total) || (parseFloat(it.Quantity) * parseFloat(it.Price)) || 0
            }
          });
        }
        proformasCount++;
      }
    }

    // 6. Sync Purchases -> ErpPurchase & ErpExpense
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
        recordsAdded: salesCount + purchasesCount + customersCount + vendorsCount + productsCount + proformasCount,
        details: `Cloud Sync Received: Customers ${customersCount}, Vendors ${vendorsCount}, Products ${productsCount}, Sales ${salesCount}, Proformas ${proformasCount}, Purchases ${purchasesCount}.`
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
      revalidatePath('/billing');
      revalidatePath('/management');
      revalidatePath('/inventory');
      revalidatePath('/sales');
      revalidatePath('/customers');
      revalidatePath('/erp/integrations/aronium');
      revalidatePath('/erp');
    } catch {
      // Background revalidation
    }

    return NextResponse.json({ 
      success: true, 
      salesCount, 
      proformasCount,
      purchasesCount, 
      productsCount, 
      customersCount, 
      vendorsCount 
    });

  } catch (error: any) {
    console.error("Cloud sync webhook error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
