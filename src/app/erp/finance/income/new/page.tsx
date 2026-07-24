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
            <label htmlFor="customerName">Customer / Client Name (Optional)</label>
            <input type="text" id="customerName" name="customerName" className={styles.input} placeholder="e.g. Acme Corp" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="service">Service / Product Name *</label>
            <input type="text" id="service" name="service" className={styles.input} required placeholder="e.g. Website Development" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select id="category" name="category" className={styles.select} required>
              <option value="">Select Category...</option>
              <option value="SALES">Sales</option>
              <option value="SERVICES">Services</option>
              <option value="CONSULTING">Consulting</option>
              <option value="MAINTENANCE">Maintenance / AMC</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount">Amount (₹) *</label>
            <input type="number" id="amount" name="amount" step="0.01" className={styles.input} required placeholder="0.00" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="gst">GST Amount (₹) (Optional)</label>
            <input type="number" id="gst" name="gst" step="0.01" className={styles.input} placeholder="0.00" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="paymentMethod">Payment Method *</label>
            <select id="paymentMethod" name="paymentMethod" className={styles.select} required>
              <option value="">Select Method...</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="paymentDate">Payment Date *</label>
            <input type="date" id="paymentDate" name="paymentDate" className={styles.input} required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="invoiceRef">Invoice Reference (Optional)</label>
            <input type="text" id="invoiceRef" name="invoiceRef" className={styles.input} placeholder="e.g. INV-2026-001" />
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
