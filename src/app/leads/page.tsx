export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Filter, Phone, Mail, Building2, Calendar } from "lucide-react";
import styles from "./page.module.css";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const currentStatus = (await searchParams).status || "ALL";

  const leads = await prisma.lead.findMany({
    where: currentStatus === "ALL" ? {} : { status: currentStatus },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Leads Pipeline</h1>
          <p className={styles.subtitle}>Track and convert your prospects.</p>
        </div>
        <Link href="/leads/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add Lead</span>
        </Link>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search leads..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          <Link href="/leads" className={`${styles.filterTab} ${currentStatus === "ALL" ? styles.activeTab : ""}`}>
            All Leads
          </Link>
          <Link href="/leads?status=NEW" className={`${styles.filterTab} ${currentStatus === "NEW" ? styles.activeTab : ""}`}>
            New
          </Link>
          <Link href="/leads?status=CONTACTED" className={`${styles.filterTab} ${currentStatus === "CONTACTED" ? styles.activeTab : ""}`}>
            Contacted
          </Link>
          <Link href="/leads?status=FOLLOW_UP" className={`${styles.filterTab} ${currentStatus === "FOLLOW_UP" ? styles.activeTab : ""}`}>
            Follow Up
          </Link>
          <Link href="/leads?status=QUALIFIED" className={`${styles.filterTab} ${currentStatus === "QUALIFIED" ? styles.activeTab : ""}`}>
            Qualified
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className={styles.emptyState}>
          <Filter size={48} className={styles.emptyIcon} />
          <h2>No leads found</h2>
          <p>You have no leads matching this status.</p>
          <Link href="/leads/new" className="btn-primary" style={{marginTop: '16px'}}>
            Create New Lead
          </Link>
        </div>
      ) : (
        <div className={styles.leadList}>
          {leads.map(lead => (
            <div key={lead.id} className={styles.leadCard}>
              <Link href={`/leads/${lead.id}`} className={styles.cardHeaderLink}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardInfo}>
                    <h3>{lead.name}</h3>
                    {lead.company && (
                      <p className={styles.company}>
                        <Building2 size={14} /> {lead.company}
                      </p>
                    )}
                    <p className={styles.date}>
                      <Calendar size={14} /> Added {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[lead.status.toLowerCase()] || styles.default}`}>
                    {lead.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
              
              <div className={styles.cardActions}>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className={styles.actionBtn}>
                    <Phone size={18} /> Call
                  </a>
                ) : (
                  <span className={`${styles.actionBtn} ${styles.disabled}`}><Phone size={18}/> Call</span>
                )}
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className={styles.actionBtn}>
                    <Mail size={18} /> Email
                  </a>
                ) : (
                  <span className={`${styles.actionBtn} ${styles.disabled}`}><Mail size={18}/> Email</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
