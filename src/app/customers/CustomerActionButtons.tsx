"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { softDeleteCustomer } from "./actions";
import { useRouter } from "next/navigation";

export function CustomerActionButtons({ customerId, variant = "icon" }: { customerId: string, variant?: "icon" | "full" }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to deactivate this customer? This will hide them from the main list.")) {
      setIsDeleting(true);
      await softDeleteCustomer(customerId);
      setIsDeleting(false);
      
      if (variant === "full") {
        router.push("/customers");
      }
    }
  };

  if (variant === "full") {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link href={`/customers/${customerId}/edit`} className="btn-secondary">
          <Edit size={16} /> Edit Customer
        </Link>
        <button onClick={handleDelete} disabled={isDeleting} className="btn-danger">
          <Trash2 size={16} /> {isDeleting ? "Deactivating..." : "Deactivate"}
        </button>
      </div>
    );
  }

  // Icon only for list view
  return (
    <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
      <Link href={`/customers/${customerId}/edit`} style={{ color: 'var(--text-secondary)' }} title="Edit Customer">
        <Edit size={18} />
      </Link>
      <button onClick={handleDelete} disabled={isDeleting} style={{ color: 'var(--color-danger)' }} title="Deactivate Customer">
        <Trash2 size={18} />
      </button>
    </div>
  );
}
