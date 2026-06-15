import { prisma } from "@/lib/prisma";
import { createServicePackage } from "../actions";
import Link from "next/link";
import styles from "../page.module.css";

export default async function NewPackagePage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New Service Package</h1>
          <p className={styles.subtitle}>Add a new service package for a customer.</p>
        </div>
      </header>

      <form action={createServicePackage} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Customer</label>
          <select name="customerId" required className={styles.select}>
            <option value="">Select Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Package Name</label>
          <input type="text" name="packageName" required className={styles.input} placeholder="e.g. Standard SEO Package" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Package Type</label>
          <select name="packageType" required className={styles.select}>
            <option value="WEBSITE">Website</option>
            <option value="ECOMMERCE">E-Commerce</option>
            <option value="SEO">SEO</option>
            <option value="MARKETING">Marketing</option>
            <option value="SOFTWARE">Software</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Price</label>
          <input type="number" step="0.01" name="packagePrice" required className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="purchaseDate">Purchase Date</label>
          <input type="date" id="purchaseDate" name="purchaseDate" required defaultValue={new Date().toISOString().split('T')[0]} className={styles.input} />
        </div>

        <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
          <input type="checkbox" id="isLifetime" name="isLifetime" style={{ width: 'auto' }} />
          <label htmlFor="isLifetime" style={{ margin: 0 }}>This is a Lifetime Package (No renewal required)</label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="renewalDate">Renewal Date</label>
          <input type="date" id="renewalDate" name="renewalDate" className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Contract Period (Months)</label>
          <input type="number" name="contractPeriod" required className={styles.input} defaultValue="12" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Status</label>
          <select name="status" className={styles.select}>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Assigned Team/Person</label>
          <input type="text" name="assignedTeam" className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Notes</label>
          <textarea name="notes" className={styles.textarea} placeholder="Any additional notes..."></textarea>
        </div>

        <div className={styles.actions}>
          <Link href="/packages" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Save Package</button>
        </div>
      </form>
    </div>
  );
}
