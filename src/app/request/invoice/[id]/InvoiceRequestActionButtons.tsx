"use client";

import { useState } from "react";
import { CreditCard, Check, Loader2 } from "lucide-react";
import styles from "@/app/quotation/[id]/page.module.css";
import { updateInvoiceStatus } from "@/app/invoice-requests/actions";

export function InvoiceRequestActionButtons({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
  const [isReporting, setIsReporting] = useState(false);

  const handleReportPayment = async () => {
    if (!confirm("Have you completed the payment? This will notify our team to verify it.")) return;
    setIsReporting(true);
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("status", "PAID");
      await updateInvoiceStatus(formData);
    } catch (err) {
      console.error(err);
      alert("Failed to report payment. Please contact support.");
    } finally {
      setIsReporting(false);
    }
  };

  if (currentStatus === "PAID") {
    return (
      <div className={styles.btnPrimary} style={{ background: '#f8fafc', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default' }}>
        <Check size={18} /> Payment Verified
      </div>
    );
  }

  return (
    <button onClick={handleReportPayment} disabled={isReporting} className={styles.btnPrimary}>
      {isReporting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
      Report Payment
    </button>
  );
}
