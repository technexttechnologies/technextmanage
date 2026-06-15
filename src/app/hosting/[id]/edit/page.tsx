import { prisma } from "@/lib/prisma";
import { updateHostingAccount } from "../../actions";
import Link from "next/link";
import styles from "../../page.module.css";
import { notFound } from "next/navigation";

export default async function EditHostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await prisma.hostingAccount.findUnique({
    where: { id }
  });

  if (!account) return notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Hosting Account</h1>
          <p className={styles.subtitle}>Update details for {account.hostingPlan}.</p>
        </div>
      </header>

      <form action={updateHostingAccount} className={styles.form}>
        <input type="hidden" name="id" value={account.id} />

        <div className={styles.formGroup}>
          <label className={styles.label}>Customer</label>
          <select name="customerId" required className={styles.select} defaultValue={account.customerId}>
            <option value="">Select Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Hosting Provider</label>
          <input type="text" name="hostingProvider" required className={styles.input} defaultValue={account.hostingProvider} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Hosting Plan</label>
          <input type="text" name="hostingPlan" required className={styles.input} defaultValue={account.hostingPlan} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Server Location</label>
          <input type="text" name="serverLocation" className={styles.input} defaultValue={account.serverLocation || ''} />
        </div>

        <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
          <input type="checkbox" id="isLifetime" name="isLifetime" defaultChecked={account.isLifetime} style={{ width: 'auto' }} />
          <label htmlFor="isLifetime" style={{ margin: 0 }}>This is a Lifetime Hosting (No renewal required)</label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Renewal Date</label>
          <input type="date" name="renewalDate" className={styles.input} defaultValue={account.renewalDate ? account.renewalDate.toISOString().split('T')[0] : ''} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cost</label>
          <input type="number" step="0.01" name="hostingCost" required className={styles.input} defaultValue={account.hostingCost} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Storage Usage</label>
          <input type="text" name="storageUsage" className={styles.input} defaultValue={account.storageUsage || ''} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Bandwidth Usage</label>
          <input type="text" name="bandwidthUsage" className={styles.input} defaultValue={account.bandwidthUsage || ''} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>SSL Status</label>
          <select name="sslStatus" className={styles.select} defaultValue={account.sslStatus}>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Expiring</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Backup Status</label>
          <select name="backupStatus" className={styles.select} defaultValue={account.backupStatus}>
            <option value="ENABLED">Enabled</option>
            <option value="DISABLED">Disabled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className={styles.actions}>
          <Link href="/hosting" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Update Hosting</button>
        </div>
      </form>
    </div>
  );
}
