export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Globe, RefreshCw, ExternalLink, Phone, Calendar, User, CheckCircle, Clock, Filter } from "lucide-react";
import styles from "./page.module.css";

export default async function EnquiriesPage() {
  // Get website-sourced leads
  const enquiryLeads = await prisma.lead.findMany({
    where: { source: { startsWith: "WEBSITE-" } },
    orderBy: { createdAt: 'desc' }
  });

  const lastSync = await prisma.syncLog.findFirst({
    where: { type: "ENQUIRY_SYNC" },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Website Enquiries</h1>
          <p className={styles.subtitle}>
            Auto-synced from your enquiry form every 15 minutes.
            {lastSync && (
              <span style={{marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)'}}>
                Last sync: {new Date(lastSync.createdAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          <form action={async () => {
            "use server";
            const { syncEnquiriesFromSheet } = await import("@/lib/sheetSync");
            const { revalidatePath } = await import("next/cache");
            try { await syncEnquiriesFromSheet(); } catch (e) { console.error(e); }
            revalidatePath("/enquiries");
          }}>
            <button type="submit" className="btn-secondary">
              <RefreshCw size={16} /> Sync Now
            </button>
          </form>
          <a href="https://appoinmentform.vercel.app/admin" target="_blank" rel="noopener noreferrer" className="btn-primary">
            <ExternalLink size={16} /> Open Booking Admin
          </a>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Globe size={20} style={{color: '#0284C7'}} />
          <div>
            <div className={styles.statValue}>{enquiryLeads.length}</div>
            <div className={styles.statLabel}>Total Enquiries</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <Clock size={20} style={{color: '#D97706'}} />
          <div>
            <div className={styles.statValue}>{enquiryLeads.filter(l => l.status === 'NEW').length}</div>
            <div className={styles.statLabel}>New / Uncontacted</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={20} style={{color: '#16A34A'}} />
          <div>
            <div className={styles.statValue}>{enquiryLeads.filter(l => l.status === 'CONTACTED' || l.status === 'QUALIFIED').length}</div>
            <div className={styles.statLabel}>Contacted</div>
          </div>
        </div>
      </div>

      {enquiryLeads.length === 0 ? (
        <div className={styles.emptyState}>
          <Globe size={48} style={{color: 'var(--text-muted)', marginBottom: '16px'}} />
          <h2>No website enquiries yet</h2>
          <p>Enquiries from your booking form at appoinmentform.vercel.app will automatically appear here.</p>
        </div>
      ) : (
        <div className={styles.enquiryList}>
          {enquiryLeads.map(lead => (
            <div key={lead.id} className={styles.enquiryCard}>
              <div className={styles.cardTop}>
                <div className={styles.cardInfo}>
                  <div className={styles.avatar}>
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{lead.name}</h3>
                    <span className={styles.sourceTag}>
                      {lead.source.replace('WEBSITE-', 'ID: ')}
                    </span>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles[lead.status.toLowerCase()]}`}>
                  {lead.status.replace('_', ' ')}
                </span>
              </div>

              <div className={styles.cardDetails}>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className={styles.detailItem}>
                    <Phone size={14} /> {lead.phone}
                  </a>
                )}
                <div className={styles.detailItem}>
                  <Calendar size={14} /> {new Date(lead.createdAt).toLocaleDateString()}
                </div>
              </div>

              {lead.notes && (
                <div className={styles.cardNotes}>{lead.notes}</div>
              )}
              
              <div className={styles.cardActions}>
                <Link href={`/leads`} className="btn-secondary" style={{fontSize: '13px', padding: '6px 12px'}}>
                  View in Leads
                </Link>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="btn-primary" style={{fontSize: '13px', padding: '6px 12px'}}>
                    <Phone size={14} /> Call Now
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
