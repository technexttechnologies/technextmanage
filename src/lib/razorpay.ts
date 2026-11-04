import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export function getRazorpayKeyId(): string {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    "rzp_live_Tw8IklmHyKf7B8"
  );
}

export function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || "UaNXqYoqahQ9bLd6s0kDl7l3";
}

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return razorpayInstance;
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = getRazorpayKeySecret();
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

async function triggerLocalAroniumSync() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    await fetch("http://127.0.0.1:4040/sync", { signal: controller.signal }).catch(() => {});
    clearTimeout(timeout);
  } catch (e) {
    // Ignore ping failure if cloud-hosted or agent not local
  }
}

export async function recordVerifiedPayment(params: {
  invoiceId: string;
  paymentId: string;
  orderId: string;
  amount: number; // in INR rupees
  method?: string;
  email?: string;
  contact?: string;
}) {
  const { invoiceId, paymentId, orderId, amount, method = "UPI / CARD" } = params;

  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id: invoiceId },
    include: { customer: true, project: true },
  });

  if (!invoice) throw new Error("Invoice document not found");

  const structured = (invoice.structuredData as any) || {};
  let schedule = Array.isArray(structured.paymentSchedule) ? [...structured.paymentSchedule] : [];

  // Check if this paymentId was already recorded to avoid duplicate entry
  const existingInstallment = schedule.find((s: any) => s.reference === paymentId || s.id === paymentId);
  if (existingInstallment) {
    return { success: true, message: "Payment already recorded" };
  }

  const newEntry = {
    id: paymentId,
    date: new Date().toISOString().split("T")[0],
    amount,
    method: `RAZORPAY (${method.toUpperCase()})`,
    reference: paymentId,
    status: "PAID",
    recordedBy: "Razorpay Live Gateway",
    recordedAt: new Date().toISOString(),
  };

  schedule.push(newEntry);

  const totalAmount = Number(structured.totalAmount !== undefined ? structured.totalAmount : invoice.amountRequested || 0);
  const totalPaid = schedule
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const amountDue = Math.max(0, totalAmount - totalPaid);
  const isPaidInFull = amountDue <= 0 || totalPaid >= totalAmount;
  const paymentStatus = isPaidInFull ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Pending";
  const invStatus = isPaidInFull ? "PAID" : "PARTIALLY_PAID";

  // Deduct inventory items if fully paid
  if (isPaidInFull && !structured.stockDeducted) {
    try {
      const items = Array.isArray(structured.items) ? structured.items : [];
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          const product = await prisma.erpProduct.findUnique({
            where: { id: item.productId }
          });
          if (product && !product.isService && product.productType !== "SERVICE") {
            const prevStock = product.currentStock;
            const newStock = Math.max(0, prevStock - item.quantity);
            await prisma.erpProduct.update({
              where: { id: item.productId },
              data: { currentStock: newStock }
            });
            await prisma.stockMovement.create({
              data: {
                productId: item.productId,
                type: "OUT",
                quantity: item.quantity,
                previousStock: prevStock,
                newStock,
                reason: `Razorpay Online Payment Fulfilled #${invoice.aroniumInvoiceNo || invoice.id.slice(-6)}`,
                referenceNo: invoice.aroniumInvoiceNo || invoice.id.slice(-6),
                createdById: invoice.assignedAdminId || invoice.requestedById
              }
            });
          }
        }
      }
    } catch (invErr) {
      console.error("[Inventory deduction on Razorpay payment failed]", invErr);
    }
  }

  await prisma.invoiceRequest.update({
    where: { id: invoiceId },
    data: {
      status: invStatus,
      structuredData: {
        ...structured,
        paymentSchedule: schedule,
        paidAmount: totalPaid,
        amountDue,
        paymentStatus,
        paymentMethod: schedule.length > 1 ? "SPLIT / MULTI-DATE" : `RAZORPAY (${method.toUpperCase()})`,
        stockDeducted: isPaidInFull ? true : structured.stockDeducted,
        needsAroniumSync: true,
        lastPaymentAt: new Date().toISOString(),
        lastPaymentId: paymentId,
        lastRazorpayOrderId: orderId
      }
    }
  });

  // Admin user or assigned user for log
  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  await prisma.activityLog.create({
    data: {
      action: "PAYMENT_RECORDED",
      entityType: "INVOICE_REQUEST",
      entityId: invoiceId,
      userId: adminUser?.id || invoice.assignedAdminId || invoice.requestedById,
      details: `Razorpay live payment of ₹${amount.toLocaleString("en-IN")} received via ${method}. Payment ID: ${paymentId}`
    }
  });

  // Send email confirmation if customer email exists
  if (invoice.customer?.email) {
    try {
      const { templates } = await import("@/lib/email-templates");
      const { generateTechnextEmailHtml, sendEmail } = await import("@/lib/mailer");
      const emailHtml = generateTechnextEmailHtml(
        "Payment Confirmation - TechNext",
        templates.paymentConfirmation({
          receiptNo: `RZP-${paymentId.slice(-8).toUpperCase()}`,
          amount,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        }),
        invoice.customer.portalToken ? {
          text: "View Updated Invoice",
          url: `${process.env.NEXT_PUBLIC_APP_URL || "https://technextmanage.vercel.app"}/portal/${invoice.customer.portalToken}/invoices/${invoice.id}`
        } : undefined
      );
      await sendEmail(invoice.customer.email, `Payment Received (₹${amount.toLocaleString("en-IN")}) - Invoice #${invoice.aroniumInvoiceNo || invoice.id.slice(-6)}`, emailHtml);
    } catch (mailErr) {
      console.error("[Razorpay Payment Confirmation Email Error]", mailErr);
    }
  }

  // Trigger local Aronium sync ping
  await triggerLocalAroniumSync();

  // Revalidate relevant cache paths
  revalidatePath(`/portal/${invoice.customer.portalToken}/invoices/${invoiceId}`);
  revalidatePath(`/portal/${invoice.customer.portalToken}`);
  revalidatePath(`/request/invoice/${invoiceId}`);
  revalidatePath(`/billing/doc/invoice/${invoiceId}`);
  revalidatePath(`/invoice-requests/${invoiceId}`);
  revalidatePath(`/invoice-requests`);
  revalidatePath(`/payments`);
  revalidatePath(`/billing`);

  return { success: true, message: "Payment successfully recorded" };
}
