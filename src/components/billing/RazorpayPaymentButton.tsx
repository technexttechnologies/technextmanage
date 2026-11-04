"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface RazorpayPaymentButtonProps {
  invoiceId: string;
  amountDue: number;
  totalAmount?: number;
  invoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  token?: string;
  isPaid?: boolean;
  variant?: "primary" | "compact" | "banner";
  onSuccess?: () => void;
}

export function RazorpayPaymentButton({
  invoiceId,
  amountDue,
  totalAmount,
  invoiceNumber,
  customerName,
  customerPhone,
  customerEmail,
  token,
  isPaid = false,
  variant = "primary",
  onSuccess,
}: RazorpayPaymentButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(isPaid);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (paySuccess || isPaid || amountDue <= 0) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: variant === "compact" ? "6px 14px" : "14px 20px",
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#065f46",
          borderRadius: "10px",
          fontSize: variant === "compact" ? "13px" : "15px",
          fontWeight: 700,
        }}
      >
        <CheckCircle size={variant === "compact" ? 16 : 18} color="#059669" />
        Payment Completed (Paid in Full)
      </div>
    );
  }

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout SDK. Please check your internet connection.");
      }

      // 2. Create order on server
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: amountDue,
          token,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // 3. Configure Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "TechNext Technologies",
        description: `Payment for Invoice #${invoiceNumber || orderData.invoiceNumber}`,
        image: "https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png",
        order_id: orderData.orderId,
        prefill: {
          name: customerName || orderData.customer?.name || "",
          email: customerEmail || orderData.customer?.email || "",
          contact: customerPhone || orderData.customer?.phone || "",
        },
        notes: {
          invoiceId,
          invoiceNumber: invoiceNumber || orderData.invoiceNumber,
        },
        theme: {
          color: "#00a2ed",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setIsLoading(true);
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoiceId,
                token,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            setPaySuccess(true);
            setIsLoading(false);
            if (onSuccess) onSuccess();
            router.refresh();
          } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMessage(err.message || "Payment verification failed. Please contact support.");
            setIsLoading(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (resp: any) {
        setIsLoading(false);
        setErrorMessage(resp.error?.description || "Payment failed. Please try again or use another payment method.");
      });

      razorpay.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(err.message || "Could not open Razorpay checkout.");
      setIsLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "4px" }}>
        <button
          type="button"
          onClick={handlePayment}
          disabled={isLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#00a2ed",
            color: "#ffffff",
            border: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0, 162, 237, 0.3)",
            opacity: isLoading ? 0.75 : 1,
            transition: "all 0.15s ease",
          }}
          title="Pay online with UPI, Cards, NetBanking via Razorpay"
        >
          {isLoading ? <Loader2 size={14} className="spin" /> : <CreditCard size={14} />}
          Pay ₹{amountDue.toLocaleString("en-IN")} Online
        </button>
        {errorMessage && (
          <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600 }}>{errorMessage}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      <button
        type="button"
        onClick={handlePayment}
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          backgroundColor: "#00a2ed",
          color: "#ffffff",
          border: "none",
          padding: "16px 24px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: 800,
          cursor: isLoading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 14px rgba(0, 162, 237, 0.35)",
          width: "100%",
          opacity: isLoading ? 0.75 : 1,
          transition: "transform 0.1s ease, box-shadow 0.1s ease",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="spin" />
            Opening Razorpay Gateway...
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Pay ₹{amountDue.toLocaleString("en-IN")} with Razorpay</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#64748b",
          padding: "0 4px",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <ShieldCheck size={13} color="#10b981" /> 256-Bit SSL Encrypted
        </span>
        <span>Supports UPI, Google Pay, PhonePe, Cards, NetBanking</span>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
