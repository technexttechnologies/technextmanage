"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { reportInvoicePayment } from "./actions";

export function InvoicePaymentButton({ invoiceId, token, currentStatus }: { invoiceId: string, token: string, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (currentStatus === 'PAID') {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
        <CheckCircle size={20} /> Payment Confirmed
      </div>
    );
  }

  if (currentStatus === 'UNDER_REVIEW') {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
        Payment under review by Admin
      </div>
    );
  }

  const handlePaymentReport = async () => {
    if (!confirm("Are you sure you want to notify the admin that this invoice has been paid?")) return;
    
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
    <button 
      onClick={handlePaymentReport}
      disabled={isUpdating}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: 'var(--color-success)',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '12px',
        width: '100%',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: isUpdating ? 'not-allowed' : 'pointer',
        opacity: isUpdating ? 0.7 : 1
      }}
    >
      {isUpdating ? <Loader2 size={20} className="spin" /> : <CheckCircle size={20} />}
      I Have Paid This Invoice
    </button>
  );
}
