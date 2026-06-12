export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Megaphone, Users, Mail, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

export default async function MarketingPage() {
  const campaigns = await prisma.marketingCampaign.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Marketing Campaigns</h1>
          <p className={styles.subtitle}>Create and monitor email marketing campaigns.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/marketing/templates" className="btn-secondary">
            <Mail size={20} />
            <span className={styles.hideMobile}>Templates</span>
          </Link>
          <Link href="/marketing/new" className="btn-primary">
            <Plus size={20} />
            <span className={styles.hideMobile}>New Campaign</span>
          </Link>
        </div>
      </header>

      {campaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={48} className={styles.emptyIcon} />
          <h2>No campaigns yet</h2>
          <p>Get started by creating your first marketing campaign.</p>
          <Link href="/marketing/new" className="btn-primary" style={{marginTop: '16px'}}>
            New Campaign
          </Link>
        </div>
      ) : (
        <div className={styles.campaignList}>
          {campaigns.map(campaign => (
            <div key={campaign.id} className={styles.campaignCard}>
              <div className={styles.campaignInfo}>
                <h3>
                  {campaign.name}
                  <span className={`${styles.statusBadge} ${styles[campaign.status.toLowerCase()] || ''}`}>
                    {campaign.status}
                  </span>
                </h3>
                <div className={styles.campaignMeta}>
                  <span><Mail size={14} style={{display: 'inline', marginRight: 4, verticalAlign: 'text-bottom'}} /> {campaign.subject}</span>
                  <span><Users size={14} style={{display: 'inline', marginRight: 4, verticalAlign: 'text-bottom'}} /> Audience: {campaign.audience}</span>
                  <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={`${styles.statValue} ${styles.success}`}>{campaign.sentCount}</span>
                  <span className={styles.statLabel}>Sent</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statValue} ${campaign.failedCount > 0 ? styles.error : ''}`}>{campaign.failedCount}</span>
                  <span className={styles.statLabel}>Failed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
