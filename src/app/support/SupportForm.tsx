"use client";

import { useState, useTransition } from "react";
import { submitPublicTicket } from "../tickets/actions";
import styles from "./page.module.css";
import { CheckCircle } from "lucide-react";

export default function SupportForm() {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const res = await submitPublicTicket(formData);
        if (res?.success) {
          setIsSuccess(true);
          setTicketId(res.ticketId);
        }
      } catch (error) {
        console.error("Failed to submit ticket", error);
        alert("Failed to submit ticket. Please try again.");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className={styles.successState}>
        <CheckCircle size={64} className={styles.successIcon} />
        <h2>Ticket Submitted Successfully</h2>
        <p>Your support request has been received. We will get back to you shortly.</p>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Reference ID: {ticketId}</p>
        <button className="btn-primary" onClick={() => setIsSuccess(false)} style={{ marginTop: "24px" }}>
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          required 
          placeholder="your@email.com" 
          disabled={isPending}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="phone">Mobile Number</label>
        <input 
          type="tel" 
          id="phone" 
          name="phone" 
          required 
          placeholder="e.g. 9876543210" 
          disabled={isPending}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="subject">Subject</label>
        <input 
          type="text" 
          id="subject" 
          name="subject" 
          required 
          placeholder="Brief summary of your issue" 
          disabled={isPending}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea 
          id="description" 
          name="description" 
          required 
          placeholder="Please provide details about your issue or request..." 
          rows={6}
          disabled={isPending}
        />
      </div>

      <button 
        type="submit" 
        className={`btn-primary ${styles.submitBtn}`} 
        disabled={isPending}
      >
        {isPending ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );
}
