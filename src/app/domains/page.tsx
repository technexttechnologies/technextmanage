export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Globe, MessageCircle } from "lucide-react";
import { getWhatsAppLink, waTemplates } from "@/lib/whatsappTemplates";
import { DomainActionButtons } from "./DomainActionButtons";
import styles from "./page.module.css";

export default async function DomainsPage() {
  const domains = await prisma.domainRegistration.findMany({
    include: {
      customer: true
    },
    orderBy: { expiryDate: 'asc' }
  });

  const now = new Date();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Domains</h1>
          <p className={styles.subtitle}>Manage customer domain registrations.</p>
        </div>
        <Link href="/domains/new" className="btn-primary">
          <Plus size={20} />
          <span>Add Domain</span>
        </Link>
      </header>

      {domains.length === 0 ? (
        <div className={styles.emptyState}>
          <Globe size={48} className={styles.emptyIcon} />
          <h2>No domains yet</h2>
          <p>Get started by adding your first domain registration.</p>
          <Link href="/domains/new" className="btn-primary" style={{marginTop: '16px', display: 'inline-flex'}}>
            Add Domain
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {domains.map(domain => {
            const diffTime = domain.expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let statusLabel = "ACTIVE";
            let statusClass = "active"; // green
            
            if (diffDays < 0) {
              statusLabel = "EXPIRED";
              statusClass = "expired"; // red
            } else if (diffDays <= 30) {
              statusLabel = "EXPIRING SOON";
              statusClass = "expiring_soon"; // orange
            }

            return (
              <div key={domain.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{domain.domainName}</h3>
                    <p className={styles.cardCustomer}>{domain.customer.name}</p>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[statusClass] || ''}`}>
                    {statusLabel}
                  </span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Registrar</span>
                  <span className={styles.detailValue}>{domain.registrar}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Cost</span>
                  <span className={styles.detailValue}>₹{domain.domainCost.toFixed(2)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Auto Renew</span>
                  <span className={styles.detailValue}>{domain.autoRenewalStatus ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Expiry</span>
                  <span className={styles.detailValue} style={{
                    color: diffDays < 0 ? '#dc2626' : diffDays <= 30 ? '#d97706' : '#16a34a',
                    fontWeight: 600
                  }}>
                    {domain.expiryDate.toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                  <a 
                    href={getWhatsAppLink(
                      domain.customer.phone,
                      waTemplates.domainRegistration(domain.customer.name, domain.domainName, domain.expiryDate)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ backgroundColor: '#25D366', color: 'white', width: '100%', justifyContent: 'center' }}
                  >
                    <MessageCircle size={16} /> Send WhatsApp Alert
                  </a>
                  <div style={{ marginTop: '8px' }}>
                    <DomainActionButtons domainId={domain.id} customerEmail={domain.customer.email} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
