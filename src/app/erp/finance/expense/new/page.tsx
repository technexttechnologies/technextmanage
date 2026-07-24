export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createExpense } from "../../actions";
import styles from "../../page.module.css";

export default async function NewExpensePage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Record New Expense</h1>
        <div className={styles.actions}>
          <Link href="/erp/finance/expense" className={styles.secondaryButton}>
            Cancel
          </Link>
        </div>
      </header>

      <div className={styles.formContainer}>
        <form action={createExpense}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Expense Title / Description *</label>
            <input type="text" id="title" name="title" className={styles.input} required placeholder="e.g. Office Supplies" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select id="category" name="category" className={styles.select} required>
              <option value="">Select Category...</option>
              <option value="OFFICE_SUPPLIES">Office Supplies</option>
              <option value="SOFTWARE_SUBSCRIPTIONS">Software & Subscriptions</option>
              <option value="RENT">Rent</option>
              <option value="UTILITIES">Utilities (Electricity, Internet)</option>
              <option value="SALARY">Salary / Wages</option>
              <option value="MARKETING">Marketing & Advertising</option>
              <option value="TRAVEL">Travel</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="vendor">Vendor / Supplier (Optional)</label>
            <input type="text" id="vendor" name="vendor" className={styles.input} placeholder="e.g. Amazon, Local Store" />
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
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" className={styles.textarea} placeholder="Any additional notes..."></textarea>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
