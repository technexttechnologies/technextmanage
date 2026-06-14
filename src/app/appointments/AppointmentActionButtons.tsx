"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteAppointment } from "./actions";
import { useRouter } from "next/navigation";

export function AppointmentActionButtons({ appointmentId }: { appointmentId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to permanently delete this appointment?")) {
      setIsDeleting(true);
      try {
        await deleteAppointment(appointmentId);
        router.refresh();
      } catch (err) {
        alert("Failed to delete.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Link href={`/appointments/${appointmentId}/edit`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
        <Edit size={14} /> Edit
      </Link>
      <button onClick={handleDelete} disabled={isDeleting} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
        <Trash2 size={14} /> {isDeleting ? "..." : "Delete"}
      </button>
    </div>
  );
}
