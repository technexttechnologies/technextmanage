export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Pending Customers (created/edited in Cloud CRM, not yet in Aronium or pending sync)
    const pendingCustomers = await prisma.customer.findMany({
      where: {
        name: { not: "" },
        OR: [
          { aroniumId: null },
          { syncStatus: "PENDING" }
        ]
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        aroniumId: true,
        customerNumber: true,
        gstNumber: true,
      }
    });

    const mappedCustomers = pendingCustomers.map(c => ({
      ...c,
      code: `TN-${c.customerNumber}`
    }));

    // 2. Pending Suppliers / Vendors
    const pendingSuppliers = await prisma.erpVendor.findMany({
      where: {
        companyName: { not: "" },
        aroniumId: null
      },
      select: {
        id: true,
        companyName: true,
        phone: true,
        email: true,
        address: true,
        aroniumId: true,
        contactPerson: true
      }
    });

    const mappedSuppliers = pendingSuppliers.map(s => ({
      id: s.id,
      name: s.companyName,
      phone: s.phone || "0000000000",
      email: s.email,
      address: s.address,
      code: `VEND-${s.id.slice(-4).toUpperCase()}`
    }));

    // 3. Pending Products (created or updated in Cloud CRM)
    const pendingProducts = await prisma.erpProduct.findMany({
      where: {
        name: { not: "" },
        OR: [
          { aroniumId: null },
          { sku: { not: null } }
        ]
      },
      select: {
        id: true,
        aroniumId: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        unit: true,
        purchasePrice: true,
        sellingPrice: true,
        taxRate: true,
        currentStock: true,
        isService: true
      }
    });

    // 4. Pending Documents (Invoices & Refunds created in Cloud CRM that need recording in Aronium POS)
    const pendingInvoices = await prisma.invoiceRequest.findMany({
      where: {
        OR: [
          { aroniumInvoiceNo: null },
          { aroniumInvoiceNo: { startsWith: "26-200-" } },
          { aroniumInvoiceNo: { startsWith: "26-220-" } },
          { aroniumInvoiceNo: { startsWith: "ORD-" } }
        ]
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, aroniumId: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const mappedDocuments = pendingInvoices.map(inv => {
      const sData = (inv.structuredData as any) || {};
      const isRefund = sData.documentType === "REFUND" || inv.aroniumInvoiceNo?.includes("220-") || Number(sData.totalAmount || inv.amountRequested) < 0;
      const docType = isRefund ? "REFUND" : (sData.documentType || (inv.aroniumInvoiceNo?.includes("ORD") ? "ORDER_FORM" : "INVOICE"));
      const totalAmount = Number(sData.totalAmount || inv.amountRequested || 0);
      const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid" || isRefund;

      return {
        id: inv.id,
        docNumber: sData.documentNumber || inv.aroniumInvoiceNo || `26-200-${inv.id.slice(-6).toUpperCase()}`,
        docType: docType,
        date: sData.date || inv.createdAt,
        dueDate: sData.dueDate || inv.createdAt,
        totalAmount: isRefund ? -Math.abs(totalAmount) : Math.abs(totalAmount),
        paidAmount: isRefund ? Math.abs(totalAmount) : (sData.paidAmount || (isPaid ? Math.abs(totalAmount) : 0)),
        status: inv.status,
        paymentStatus: isRefund ? "Refunded" : (isPaid ? "Paid" : "Pending"),
        paymentMethod: sData.paymentMethod || (isRefund ? "REFUND / REVERSAL" : "UPI PAYMENT"),
        customerId: inv.customer?.id,
        customerName: inv.customer?.name || "Client",
        customerPhone: inv.customer?.phone,
        customerAroniumId: inv.customer?.aroniumId,
        items: (sData.items && Array.isArray(sData.items) && sData.items.length > 0)
          ? sData.items.map((it: any) => ({
              name: it.name || "Item",
              code: it.code || it.sku || `SKU-${inv.id.slice(-4)}`,
              quantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice) || 0,
              priceBeforeTax: Number(it.priceBeforeTax || it.unitPrice) || 0,
              total: Number(it.total) || 0,
              unit: it.unit || "Pcs",
              isService: it.unit?.toUpperCase().includes("SERV") || it.unit?.toUpperCase().includes("SOFTWARE") || false
            }))
          : [
              {
                name: inv.notes || (isRefund ? "Refund / Service Cancellation" : "Professional Service"),
                code: inv.aroniumInvoiceNo || `SKU-${inv.id.slice(-4)}`,
                quantity: 1,
                unitPrice: isRefund ? -Math.abs(totalAmount) : Math.abs(totalAmount),
                priceBeforeTax: isRefund ? -Math.abs(totalAmount) : Math.abs(totalAmount),
                total: isRefund ? -Math.abs(totalAmount) : Math.abs(totalAmount),
                unit: isRefund ? "Refund" : "Service",
                isService: true
              }
            ]
      };
    });

    return NextResponse.json({
      success: true,
      customers: mappedCustomers,
      suppliers: mappedSuppliers,
      products: pendingProducts,
      documents: mappedDocuments
    });
  } catch (error: any) {
    console.error("Send to Aronium Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
