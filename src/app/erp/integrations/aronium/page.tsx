import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import styles from './page.module.css';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensure fresh stats

export default async function AroniumDashboardPage() {
  const config = await prisma.aroniumConfig.findFirst();

  if (!config) {
    redirect('/erp/integrations/aronium/setup');
  }

  // Fetch widgets data
  const [totalSales, totalProducts, lowStockItems] = await Promise.all([
    prisma.erpSale.count(),
    prisma.erpProduct.count(),
    prisma.erpProduct.count({ where: { isLowStock: true } })
  ]);

  const totalCustomers = config.totalCustomers;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Aronium ERP Integration
            <span className={`${styles.statusBadge} ${config.status === 'ONLINE' ? styles.statusOnline : styles.statusOffline}`}>
              {config.status}
            </span>
          </h1>
          <p className={styles.subtitle}>
            Branch: {config.branchName} | 
            Last Sync: {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : 'Never'}
          </p>
        </div>
        <Link href="/erp/integrations/aronium/setup" className={styles.downloadButton} style={{ background: 'var(--surface-border)', color: 'var(--text-primary)' }}>
          Settings
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Sales</span>
          </div>
          <div className={styles.statValue}>{totalSales}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Products</span>
          </div>
          <div className={styles.statValue}>{totalProducts}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Low Stock Items</span>
          </div>
          <div className={styles.statValue}>{lowStockItems}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Synced Customers</span>
          </div>
          <div className={styles.statValue}>{totalCustomers}</div>
        </div>
      </div>

      <div className={styles.agentSection}>
        <h2 className={styles.agentTitle}>Sync Agent Setup</h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
          To sync your local Aronium POS database with the cloud ERP, download the sync agent and configure it with your unique token.
        </p>
        
        <div className={styles.codeBlock}>
          <div>// Set this token in your sync agent configuration (.env or config.json)</div>
          <div>SYNC_TOKEN="<span className={styles.syncToken}>{config.syncToken}</span>"</div>
        </div>

        <a href="/aronium-sync-agent.js" download className={styles.downloadButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Sync Agent
        </a>
      </div>
    </div>
  );
}
