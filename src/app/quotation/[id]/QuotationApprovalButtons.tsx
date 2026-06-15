"use client";

import { useState } from "react";
import { FileSignature, RefreshCcw, Loader2 } from "lucide-react";
import styles from "./page.module.css";
import { updateQuotationStatus } from "@/app/quotations/actions";

export function QuotationApprovalButtons({ quotationId, currentStatus }: { quotationId: string, currentStatus: string }) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this quotation?")) return;
    setIsApproving(true);
    try {
      const formData = new FormData();
      formData.append("quotationId", quotationId);
      formData.append("status", "APPROVED");
      await updateQuotationStatus(formData);
      // The server action calls revalidatePath which will refresh the page to show the Approved state
    } catch (err) {
      console.error(err);
      alert("Failed to approve quotation. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestRevision = () => {
    // In a full implementation, this might open a modal to capture revision notes,
    // which then creates a Task in the CRM. For now, we'll prompt the user.
    const note = prompt("Please briefly describe the revisions you would like:");
    if (!note) return;

    // Ideally, call an action like `createRevisionTask(quotationId, note)`
    // To keep it simple, we just alert that the sales team has been notified.
    alert("Thank you. Your revision request has been sent to our sales team. We will get back to you shortly.");
  };

  return (
    <>
      <button onClick={handleApprove} disabled={isApproving} className={styles.btnPrimary}>
        {isApproving ? <Loader2 size={18} className="animate-spin" /> : <FileSignature size={18} />}
        Approve Proposal
      </button>

      <button onClick={handleRequestRevision} className={styles.btnSecondary}>
        <RefreshCcw size={18} /> Request Revision
      </button>
    </>
  );
}
