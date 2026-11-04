import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, getRazorpayKeyId } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId, amount: requestedAmount, token } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const invoice = await prisma.invoiceRequest.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Optional token validation if token provided
    if (token && invoice.customer.portalToken && invoice.customer.portalToken !== token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const structured = (invoice.structuredData as any) || {};
    const total = Number(structured.totalAmount !== undefined ? structured.totalAmount : invoice.amountRequested || 0);
    const paid = Number(structured.paidAmount || (invoice.status === "PAID" ? total : 0));
    const balanceDue = Number(structured.amountDue !== undefined ? structured.amountDue : Math.max(0, total - paid));

    if (balanceDue <= 0 && invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid in full" }, { status: 400 });
    }

    // Amount to charge (in INR)
    let amountToCharge = requestedAmount ? Number(requestedAmount) : balanceDue;
    if (isNaN(amountToCharge) || amountToCharge <= 0) {
      amountToCharge = balanceDue > 0 ? balanceDue : total;
    }

    // Razorpay requires amount in Paise (1 INR = 100 Paise), minimum 1 INR (100 paise)
    const amountInPaise = Math.max(100, Math.round(amountToCharge * 100));

    const razorpay = getRazorpayClient();
    const orderReceipt = `INV-${invoice.aroniumInvoiceNo || invoice.id.slice(-8)}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderReceipt.slice(0, 40),
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.aroniumInvoiceNo || invoice.id.slice(-6).toUpperCase(),
        customerId: invoice.customer.id,
        customerName: invoice.customer.name,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      amountInRupees: amountToCharge,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      invoiceNumber: invoice.aroniumInvoiceNo || invoice.id.slice(-6).toUpperCase(),
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email || "",
        phone: invoice.customer.phone || "",
      },
      company: {
        name: "TechNext Technologies",
        description: `Payment for Invoice #${invoice.aroniumInvoiceNo || invoice.id.slice(-6).toUpperCase()}`,
      },
    });
  } catch (error: any) {
    console.error("[Razorpay Create Order Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate Razorpay order" },
      { status: 500 }
    );
  }
}
