
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSubscription } from "../actions";
import styles from "../page.module.css";

export default async function NewSubscriptionPage() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Add New Subscription</h1>
          <p className={styles.subtitle}>Track a recurring service or software subscription.</p>
        </div>
      </div>

      <div className={styles.formContainer}>
        <form action={createSubscription}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Subscription Name *</label>
            <input name="name" required className={styles.input} placeholder="AWS Hosting, Microsoft 365, etc." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Service Provider *</label>
            <input name="provider" required className={styles.input} placeholder="Amazon, Microsoft, Google..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Cost (₹) *</label>
            <input type="number" step="0.01" name="cost" required className={styles.input} placeholder="5000" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Billing Cycle *</label>
            <select name="billingCycle" required className={styles.select}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Next Billing Date *</label>
            <input type="date" name="nextBillingDate" required className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Notes</label>
            <textarea name="notes" className={styles.textarea} placeholder="Login details, purpose, etc." />
          </div>

          <div style={{ marginTop: "2rem" }}>
            <Link href="/erp/subscriptions" className={styles.cancelBtn}>Cancel</Link>
            <button type="submit" className={styles.submitBtn}>Save Subscription</button>
          </div>
        </form>
      </div>
    </div>
  );
}
