"use client";

import { useState, useTransition } from "react";
import { replyToTicket } from "../actions";

export default function TicketReplyForm({ ticketId, userId }: { ticketId: string; userId?: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const formData = new FormData();
    formData.append("message", message);
    if (userId) formData.append("senderId", userId);
    formData.append("isInternal", isInternal.toString());

    startTransition(async () => {
      await replyToTicket(ticketId, formData);
      setMessage("");
      setIsInternal(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your reply here..."
        style={{ width: "100%", minHeight: "100px", padding: "12px", borderRadius: "8px", border: "1px solid var(--surface-border)", backgroundColor: "var(--surface-background)", color: "inherit", fontFamily: "inherit" }}
        disabled={isPending}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
          <input 
            type="checkbox" 
            checked={isInternal} 
            onChange={(e) => setIsInternal(e.target.checked)} 
            disabled={isPending} 
          />
          Internal Note (Hidden from Customer)
        </label>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isPending || !message.trim()}
          style={{ padding: "8px 24px" }}
        >
          {isPending ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </form>
  );
}
