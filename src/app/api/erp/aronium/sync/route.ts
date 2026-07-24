import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncToken = authHeader.split(' ')[1];
    const config = await prisma.aroniumConfig.findFirst({
      where: { syncToken },
    });

    if (!config) {
      return NextResponse.json({ error: 'Invalid sync token' }, { status: 403 });
    }

    const body = await req.json();
    const { type, data } = body;

    if (!type || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Default user for fallback operations
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    }) || await prisma.user.findFirst();

    if (!defaultUser) {
      return NextResponse.json({ error: 'No admin user found to assign records' }, { status: 500 });
    }

    if (type === 'PRODUCTS') {
      for (const product of data) {
        const currentStock = parseFloat(product.currentStock) || 0;
        const reorderLevel = parseFloat(product.reorderLevel) || 0;
        const isLowStock = currentStock < reorderLevel;

        await prisma.erpProduct.upsert({
          where: { aroniumId: String(product.aroniumId) },
          update: {
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category,
            brand: product.brand,
            purchasePrice: parseFloat(product.purchasePrice) || 0,
            sellingPrice: parseFloat(product.sellingPrice) || 0,
            currentStock,
            reorderLevel,
            isLowStock,
          },
          create: {
            aroniumId: String(product.aroniumId),
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category,
            brand: product.brand,
            purchasePrice: parseFloat(product.purchasePrice) || 0,
            sellingPrice: parseFloat(product.sellingPrice) || 0,
            currentStock,
            reorderLevel,
            isLowStock,
          }
        });
      }
    } else if (type === 'SALES') {
      for (const sale of data) {
        const totalAmount = parseFloat(sale.totalAmount) || 0;
        const existingSale = await prisma.erpSale.findUnique({
          where: { aroniumId: String(sale.aroniumId) }
        });

        await prisma.erpSale.upsert({
          where: { aroniumId: String(sale.aroniumId) },
          update: {
            invoiceNumber: sale.invoiceNumber,
            date: new Date(sale.date),
            totalAmount,
            discount: parseFloat(sale.discount) || 0,
            gst: parseFloat(sale.gst) || 0,
            paymentMethod: sale.paymentMethod || 'CASH',
            paymentStatus: sale.paymentStatus || 'PAID',
            salesperson: sale.salesperson,
            branch: sale.branch,
          },
          create: {
            aroniumId: String(sale.aroniumId),
            invoiceNumber: sale.invoiceNumber,
            date: new Date(sale.date),
            totalAmount,
            discount: parseFloat(sale.discount) || 0,
            gst: parseFloat(sale.gst) || 0,
            paymentMethod: sale.paymentMethod || 'CASH',
            paymentStatus: sale.paymentStatus || 'PAID',
            salesperson: sale.salesperson,
            branch: sale.branch,
          }
        });

        // Automatically create a corresponding ErpIncome record for NEW sales
        if (!existingSale) {
          await prisma.erpIncome.create({
            data: {
              date: new Date(sale.date),
              amount: totalAmount,
              category: "Aronium Sales",
              paymentMethod: sale.paymentMethod || 'CASH',
              aroniumId: String(sale.aroniumId),
              recordedById: defaultUser.id,
              notes: `Auto-generated from Aronium Sale: ${sale.invoiceNumber}`
            }
          });
        }
      }
    } else if (type === 'PURCHASES') {
      for (const purchase of data) {
        const totalAmount = parseFloat(purchase.totalAmount) || 0;
        const existingPurchase = await prisma.erpPurchase.findUnique({
          where: { aroniumId: String(purchase.aroniumId) }
        });

        await prisma.erpPurchase.upsert({
          where: { aroniumId: String(purchase.aroniumId) },
          update: {
            orderNumber: purchase.orderNumber,
            date: new Date(purchase.date),
            totalAmount,
            status: 'PAID'
          },
          create: {
            aroniumId: String(purchase.aroniumId),
            orderNumber: purchase.orderNumber,
            date: new Date(purchase.date),
            totalAmount,
            status: 'PAID'
          }
        });

        if (!existingPurchase) {
          await prisma.erpExpense.create({
            data: {
              title: `Aronium Purchase: ${purchase.orderNumber}`,
              category: "Aronium Purchases",
              amount: totalAmount,
              paymentMethod: "Aronium Sync",
              paymentDate: new Date(purchase.date),
              status: "PAID",
              recordedById: defaultUser.id,
              notes: `Auto-generated from Aronium Purchase`
            }
          });
        }
      }
    } else if (type === 'CUSTOMERS') {
      for (const customer of data) {
        // Try to match by aroniumId first
        const existingCustomer = await prisma.customer.findFirst({
          where: { aroniumId: String(customer.aroniumId) }
        });

        if (existingCustomer) {
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: customer.name,
              phone: customer.phone || existingCustomer.phone,
              email: customer.email,
              address: customer.address,
              aroniumCode: customer.aroniumCode,
            }
          });
        } else {
          await prisma.customer.create({
            data: {
              name: customer.name,
              phone: customer.phone || 'N/A', 
              email: customer.email,
              address: customer.address,
              aroniumId: String(customer.aroniumId),
              aroniumCode: customer.aroniumCode,
              assignedToId: defaultUser.id,
              status: "ACTIVE"
            }
          });
        }
      }
    }

    await prisma.aroniumConfig.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        status: 'ONLINE'
      }
    });

    return NextResponse.json({ success: true, message: `Synced ${data.length} ${type} successfully.` });
  } catch (error: any) {
    console.error('Aronium Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
