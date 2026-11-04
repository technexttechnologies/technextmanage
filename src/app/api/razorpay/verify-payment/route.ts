import { NextResponse } from "next/server";
import {
  verifyRazorpaySignature,
  getRazorpayClient,
  recordVerifiedPayment,
} from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      invoiceId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!invoiceId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay cryptographic signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error("[Razorpay Invalid Signature]", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Payment verification failed: invalid signature" },
        { status: 400 }
      );
    }

    // 2. Fetch payment details from Razorpay API to confirm capture and amount
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${payment.status}` },
        { status: 400 }
      );
    }

    // Amount in INR rupees
    const amountInRupees = Number(payment.amount) / 100;
    const paymentMethod = payment.method || "ONLINE";

    // 3. Record verified payment in the database
    const result = await recordVerifiedPayment({
      invoiceId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amountInRupees,
      method: paymentMethod,
      email: payment.email || undefined,
      contact: payment.contact || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and recorded!",
      paymentId: razorpay_payment_id,
      amount: amountInRupees,
      method: paymentMethod,
    });
  } catch (error: any) {
    console.error("[Razorpay Verify Payment Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify and record payment" },
      { status: 500 }
    );
  }
}
