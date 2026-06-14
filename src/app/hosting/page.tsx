export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Server, Shield, Database } from "lucide-react";
import styles from "./page.module.css";

export default async function HostingPage() {
  const hostingAccounts = await prisma.hostingAccount.findMany({
    include: {
      customer: true
    },
    orderBy: { renewalDate: 'asc' }
  });

  const now = new Date();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Hosting Accounts</h1>
          <p className={styles.subtitle}>Manage customer hosting and server infrastructure.</p>
        </div>
        <Link href="/hosting/new" className="btn-primary">
          <Plus size={20} />
          <span>Add Hosting</span>
        </Link>
      </header>

      {hostingAccounts.length === 0 ? (
        <div className={styles.emptyState}>
          <Server size={48} className={styles.emptyIcon} />
          <h2>No hosting accounts yet</h2>
          <p>Get started by adding your first hosting account.</p>
          <Link href="/hosting/new" className="btn-primary" style={{marginTop: '16px', display: 'inline-flex'}}>
            Add Hosting
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {hostingAccounts.map(account => {
            const diffTime = account.renewalDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let statusClass = "active";
            let statusLabel = "ACTIVE";
            if (diffDays < 0) {
              statusClass = "expired";
              statusLabel = "EXPIRED";
            } else if (diffDays <= 30) {
              statusClass = "expiring_soon";
              statusLabel = "EXPIRING SOON";
            }

            return (
              <div key={account.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{account.hostingProvider} - {account.hostingPlan}</h3>
                    <p className={styles.cardCustomer}>{account.customer.name}</p>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[statusClass] || ''}`}>
                    {statusLabel}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <span className={`${styles.statusBadge} ${styles[account.sslStatus.toLowerCase()] || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} /> SSL: {account.sslStatus}
                  </span>
                  <span className={`${styles.statusBadge} ${account.backupStatus === 'ENABLED' ? styles.active : styles.expired}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Database size={12} /> Backup: {account.backupStatus}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Location</span>
                  <span className={styles.detailValue}>{account.serverLocation || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Storage</span>
                  <span className={styles.detailValue}>{account.storageUsage || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Bandwidth</span>
                  <span className={styles.detailValue}>{account.bandwidthUsage || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Cost</span>
                  <span className={styles.detailValue}>₹{account.hostingCost.toFixed(2)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Renewal</span>
                  <span className={styles.detailValue} style={{
                    color: diffDays < 0 ? '#dc2626' : diffDays <= 30 ? '#d97706' : '#16a34a',
                    fontWeight: 600
                  }}>
                    {account.renewalDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
