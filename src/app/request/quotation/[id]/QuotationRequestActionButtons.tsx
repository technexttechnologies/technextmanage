"use client";

import { useState } from "react";
import { FileSignature, Check, Loader2 } from "lucide-react";
import styles from "@/app/quotation/[id]/page.module.css";
import { updateQuotationStatus } from "@/app/quotation-requests/actions";

export function QuotationRequestActionButtons({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to accept this proposal?")) return;
    setIsApproving(true);
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("status", "ACCEPTED");
      await updateQuotationStatus(formData);
    } catch (err) {
      console.error(err);
      alert("Failed to accept proposal. Please contact support.");
    } finally {
      setIsApproving(false);
    }
  };

  if (currentStatus === "ACCEPTED") {
    return (
      <div className={styles.btnPrimary} style={{ background: '#f8fafc', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default' }}>
        <Check size={18} /> Proposal Accepted
      </div>
    );
  }

  return (
    <button onClick={handleApprove} disabled={isApproving} className={styles.btnPrimary}>
      {isApproving ? <Loader2 size={18} className="animate-spin" /> : <FileSignature size={18} />}
      Accept Proposal
    </button>
  );
}
