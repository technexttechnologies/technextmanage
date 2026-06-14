"use client";

import { useState } from "react";
import { Edit, Trash2, Mail } from "lucide-react";
import Link from "next/link";
import { deleteQuotationRequest, sendQuotationRequestEmail } from "./actions";
import { useRouter } from "next/navigation";

export function QuotationRequestActionButtons({ requestId, customerEmail }: { requestId: string, customerEmail?: string | null }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to permanently delete this quotation request?")) {
      setIsDeleting(true);
      try {
        await deleteQuotationRequest(requestId);
        router.push("/quotation-requests");
      } catch (err) {
        alert("Failed to delete or you are not authorized.");
        setIsDeleting(false);
      }
    }
  };

  const handleSendEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!customerEmail) {
      alert("This customer does not have an email address.");
      return;
    }
    setIsSending(true);
    await sendQuotationRequestEmail(requestId);
    setIsSending(false);
    alert("Status update email sent to customer.");
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={handleSendEmail} disabled={isSending || !customerEmail} className="btn-primary" style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}>
        <Mail size={16} /> {isSending ? "Sending..." : "Send Email"}
      </button>
      <Link href={`/quotation-requests/${requestId}/edit`} className="btn-secondary">
        <Edit size={16} /> Edit
      </Link>
      <button onClick={handleDelete} disabled={isDeleting} className="btn-danger">
        <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
