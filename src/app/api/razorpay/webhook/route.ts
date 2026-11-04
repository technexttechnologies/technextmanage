import { NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  recordVerifiedPayment,
} from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // If webhook secret configured, verify signature
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes || event.payload?.order?.entity?.notes || {};
      const invoiceId = notes.invoiceId;

      if (invoiceId && payment && payment.status === "captured") {
        const amountInRupees = Number(payment.amount) / 100;
        await recordVerifiedPayment({
          invoiceId,
          paymentId: payment.id,
          orderId: payment.order_id || "",
          amount: amountInRupees,
          method: payment.method || "ONLINE",
          email: payment.email,
          contact: payment.contact,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
