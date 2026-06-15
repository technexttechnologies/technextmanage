import { prisma } from "@/lib/prisma";
import { updatePackage } from "../../actions";
import Link from "next/link";
import styles from "../../page.module.css";
import { notFound } from "next/navigation";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await prisma.servicePackage.findUnique({
    where: { id }
  });

  if (!pkg) return notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Service Package</h1>
          <p className={styles.subtitle}>Update details for {pkg.packageName}.</p>
        </div>
      </header>

      <form action={updatePackage} className={styles.form}>
        <input type="hidden" name="id" value={pkg.id} />

        <div className={styles.formGroup}>
          <label className={styles.label}>Customer</label>
          <select name="customerId" required className={styles.select} defaultValue={pkg.customerId}>
            <option value="">Select Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Package Name</label>
          <input type="text" name="packageName" required className={styles.input} defaultValue={pkg.packageName} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Package Type</label>
          <input type="text" name="packageType" required className={styles.input} defaultValue={pkg.packageType} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Contract Period (Months)</label>
          <input type="number" name="contractPeriod" required className={styles.input} defaultValue={pkg.contractPeriod} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="purchaseDate">Purchase Date</label>
          <input type="date" id="purchaseDate" name="purchaseDate" required defaultValue={pkg.purchaseDate ? pkg.purchaseDate.toISOString().split('T')[0] : ''} />
        </div>

        <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
          <input type="checkbox" id="isLifetime" name="isLifetime" defaultChecked={pkg.isLifetime} style={{ width: 'auto' }} />
          <label htmlFor="isLifetime" style={{ margin: 0 }}>This is a Lifetime Package (No renewal required)</label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="renewalDate">Renewal Date</label>
          <input type="date" id="renewalDate" name="renewalDate" defaultValue={pkg.renewalDate ? pkg.renewalDate.toISOString().split('T')[0] : ""} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Price</label>
          <input type="number" step="0.01" name="packagePrice" required className={styles.input} defaultValue={pkg.packagePrice} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Status</label>
          <select name="status" className={styles.select} defaultValue={pkg.status}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Notes</label>
          <textarea name="notes" className={styles.textarea} defaultValue={pkg.notes || ''}></textarea>
        </div>

        <div className={styles.actions}>
          <Link href="/packages" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Update Package</button>
        </div>
      </form>
    </div>
  );
}
