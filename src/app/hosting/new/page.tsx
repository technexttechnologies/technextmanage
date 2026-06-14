import { prisma } from "@/lib/prisma";
import { createHostingAccount } from "../actions";
import Link from "next/link";
import styles from "../page.module.css";

export default async function NewHostingPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New Hosting Account</h1>
          <p className={styles.subtitle}>Add a new hosting account for a customer.</p>
        </div>
      </header>

      <form action={createHostingAccount} className={styles.form}>
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
          <label className={styles.label}>Hosting Provider</label>
          <input type="text" name="hostingProvider" required className={styles.input} placeholder="e.g. AWS, DigitalOcean, HostGator" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Hosting Plan</label>
          <input type="text" name="hostingPlan" required className={styles.input} placeholder="e.g. Shared, VPS, Dedicated" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Server Location</label>
          <input type="text" name="serverLocation" className={styles.input} placeholder="e.g. Mumbai, Singapore" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cost</label>
          <input type="number" step="0.01" name="hostingCost" required className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Renewal Date</label>
          <input type="date" name="renewalDate" required className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Storage Usage / Limit</label>
          <input type="text" name="storageUsage" className={styles.input} placeholder="e.g. 5GB / 20GB" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Bandwidth Usage</label>
          <input type="text" name="bandwidthUsage" className={styles.input} placeholder="e.g. 100GB/mo" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>SSL Status</label>
          <select name="sslStatus" className={styles.select}>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Backup Status</label>
          <select name="backupStatus" className={styles.select}>
            <option value="ENABLED">Enabled</option>
            <option value="DISABLED">Disabled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className={styles.actions}>
          <Link href="/hosting" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Save Hosting</button>
        </div>
      </form>
    </div>
  );
}
