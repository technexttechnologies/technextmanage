"use client";

import { useTransition } from "react";
import { updateTicketStatus } from "../actions";

export default function TicketClientActions({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      await updateTicketStatus(ticketId, newStatus);
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Status:</label>
      <select 
        value={currentStatus} 
        onChange={handleStatusChange} 
        disabled={isPending}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid var(--surface-border)",
          backgroundColor: "var(--surface-card)",
          color: "inherit",
          fontSize: "14px",
          cursor: "pointer"
        }}
      >
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>
      {isPending && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Updating...</span>}
    </div>
  );
}
