"use client";

import { useState } from "react";
import { CheckCircle, Loader2, CreditCard, ChevronDown } from "lucide-react";
import { reportInvoicePayment } from "./actions";
import { RazorpayPaymentButton } from "@/components/billing/RazorpayPaymentButton";

interface Props {
  invoiceId: string;
  token: string;
  currentStatus: string;
  amountDue?: number;
  totalAmount?: number;
  invoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export function InvoicePaymentButton({
  invoiceId,
  token,
  currentStatus,
  amountDue = 0,
  totalAmount = 0,
  invoiceNumber,
  customerName,
  customerPhone,
  customerEmail,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOfflineOption, setShowOfflineOption] = useState(false);

  if (currentStatus === "PAID") {
    return (
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#065f46",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 700,
          fontSize: "15px",
        }}
      >
        <CheckCircle size={22} color="#059669" />
        Payment Confirmed — Paid in Full
      </div>
    );
  }

  const handlePaymentReport = async () => {
    if (!confirm("Are you sure you want to notify the admin that this invoice has been paid via offline / direct transfer?")) return;

    setIsUpdating(true);
    try {
      await reportInvoicePayment(invoiceId, token);
      alert("Payment notification sent to admin successfully.");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* Primary: Live Razorpay Gateway Payment (UPI, Cards, NetBanking) */}
      <RazorpayPaymentButton
        invoiceId={invoiceId}
        amountDue={amountDue > 0 ? amountDue : totalAmount}
        totalAmount={totalAmount}
        invoiceNumber={invoiceNumber}
        customerName={customerName}
        customerPhone={customerPhone}
        customerEmail={customerEmail}
        token={token}
        isPaid={currentStatus === "PAID"}
        variant="primary"
      />

      {/* Secondary: Offline / Direct Bank Transfer Option */}
      <div style={{ textAlign: "center", marginTop: "4px" }}>
        {currentStatus === "UNDER_REVIEW" ? (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              color: "#92400e",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Offline payment notification submitted. Admin verification in progress.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowOfflineOption(!showOfflineOption)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Paid via direct bank transfer or offline cash? Notify Admin
              <ChevronDown size={13} style={{ transform: showOfflineOption ? "rotate(180deg)" : "none" }} />
            </button>

            {showOfflineOption && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#475569" }}>
                  If you already transferred funds directly to our South Indian Bank account or paid in person, let our accounts team know:
                </p>
                <button
                  type="button"
                  onClick={handlePaymentReport}
                  disabled={isUpdating}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: isUpdating ? "not-allowed" : "pointer",
                  }}
                >
                  {isUpdating ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                  I Have Already Transferred Offline
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
