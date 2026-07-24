export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createIncome } from "../../actions";
import styles from "../../page.module.css";

export default async function NewIncomePage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Record New Income</h1>
        <div className={styles.actions}>
          <Link href="/erp/finance/income" className={styles.secondaryButton}>
            Cancel
          </Link>
        </div>
      </header>

      <div className={styles.formContainer}>
        <form action={createIncome}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select id="category" name="category" className={styles.select} required>
              <option value="">Select Category...</option>
              <option value="Daily Sales">Daily Sales</option>
              <option value="Services">Services</option>
              <option value="Consulting">Consulting</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount">Amount (₹) *</label>
            <input type="number" id="amount" name="amount" step="0.01" className={styles.input} required placeholder="0.00" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="paymentMethod">Payment Method *</label>
            <select id="paymentMethod" name="paymentMethod" className={styles.select} required>
              <option value="">Select Method...</option>
              <option value="Cash/Card">Cash/Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="date">Date *</label>
            <input type="date" id="date" name="date" className={styles.input} required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="aroniumId">Aronium ID (Optional)</label>
            <input type="text" id="aroniumId" name="aroniumId" className={styles.input} placeholder="e.g. Sync ID" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" className={styles.textarea} placeholder="Any additional notes..."></textarea>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              Record Income
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
