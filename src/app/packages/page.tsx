export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import styles from "./page.module.css";

export default async function PackagesPage() {
  const packages = await prisma.servicePackage.findMany({
    include: {
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Service Packages</h1>
          <p className={styles.subtitle}>Manage your customer service packages.</p>
        </div>
        <Link href="/packages/new" className="btn-primary">
          <Plus size={20} />
          <span>Add Package</span>
        </Link>
      </header>

      {packages.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <h2>No packages yet</h2>
          <p>Get started by adding your first service package.</p>
          <Link href="/packages/new" className="btn-primary" style={{marginTop: '16px', display: 'inline-flex'}}>
            Add Package
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {packages.map(pkg => (
            <div key={pkg.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{pkg.packageName}</h3>
                  <p className={styles.cardCustomer}>{pkg.customer.name}</p>
                </div>
                <span className={`${styles.statusBadge} ${styles[pkg.status.toLowerCase()] || ''}`}>
                  {pkg.status}
                </span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Type</span>
                <span className={styles.detailValue}>{pkg.packageType}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Price</span>
                <span className={styles.detailValue}>₹{pkg.packagePrice.toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Contract Period</span>
                <span className={styles.detailValue}>{pkg.contractPeriod} Months</span>
              </div>
              {pkg.renewalDate && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Renewal Date</span>
                  <span className={styles.detailValue}>
                    {pkg.renewalDate.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
