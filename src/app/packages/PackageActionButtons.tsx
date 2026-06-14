"use client";

import { useState } from "react";
import { Edit, Trash2, Mail } from "lucide-react";
import Link from "next/link";
import { deletePackage, sendPackageReminderEmail } from "./actions";

export function PackageActionButtons({ packageId, customerEmail }: { packageId: string, customerEmail: string | null }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this package?")) {
      setIsDeleting(true);
      await deletePackage(packageId);
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!customerEmail) {
      alert("This customer does not have an email address.");
      return;
    }
    if (confirm(`Send package reminder email to ${customerEmail}?`)) {
      setIsSending(true);
      await sendPackageReminderEmail(packageId);
      setIsSending(false);
      alert("Email sent successfully!");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
      <Link href={`/packages/${packageId}/edit`} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
        <Edit size={16} /> Edit
      </Link>
      <button 
        onClick={handleDelete} 
        disabled={isDeleting}
        className="btn-danger" 
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <Trash2 size={16} /> {isDeleting ? "..." : "Delete"}
      </button>
      <button 
        onClick={handleSendEmail} 
        disabled={isSending || !customerEmail}
        className="btn-primary" 
        style={{ flex: 1, justifyContent: 'center', backgroundColor: '#3b82f6', border: 'none' }}
      >
        <Mail size={16} /> {isSending ? "..." : "Email"}
      </button>
    </div>
  );
}
