import { createFollowUp } from "../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import styles from "./page.module.css";

export default async function NewFollowUpPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/follow-ups" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Schedule Follow-up</h1>
      </header>

      <form action={createFollowUp} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Details</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="customerId">Select Customer *</label>
            <select id="customerId" name="customerId" required>
              <option value="">-- Choose a Customer --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.company ? `(${customer.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="type">Follow-up Type *</label>
              <select id="type" name="type" required>
                <option value="Call">Phone Call</option>
                <option value="Meeting">Meeting (In Person/Virtual)</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp Message</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="date">Date & Time *</label>
              {/* Note: In a real app, you'd use a datetime-local input or a date picker component */}
              <input type="datetime-local" id="date" name="date" required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="notes">Agenda / Notes</label>
            <textarea id="notes" name="notes" rows={4} placeholder="What do you need to discuss?..." />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/follow-ups" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <CalendarPlus size={18} />
            Schedule Follow-up
          </button>
        </div>
      </form>
    </div>
  );
}
