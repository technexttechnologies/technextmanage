import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, RefreshCw, AlertTriangle, CheckCircle, Search } from "lucide-react";
import styles from "./page.module.css";

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const currentFilter = (await searchParams).filter || "ALL";

  // Date threshold for "upcoming" (e.g. next 30 days)
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  let whereClause = {};
  if (currentFilter === "UPCOMING") {
    whereClause = {
      expiryDate: { lte: nextMonth, gte: today },
      status: "ACTIVE"
    };
  } else if (currentFilter === "EXPIRED") {
    whereClause = {
      expiryDate: { lt: today },
      status: "ACTIVE" // If it's active but past expiry, it's expired
    };
  } else if (currentFilter === "ALL") {
    whereClause = {};
  }

  const renewals = await prisma.renewal.findMany({
    where: whereClause,
    include: {
      customer: true
    },
    orderBy: { expiryDate: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Renewals</h1>
          <p className={styles.subtitle}>Track domains, hosting, SSL, and service renewals.</p>
        </div>
        <Link href="/renewals/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add Renewal</span>
        </Link>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search domains/services..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          <Link href="/renewals?filter=ALL" className={`${styles.filterTab} ${currentFilter === "ALL" ? styles.activeTab : ""}`}>
            All
          </Link>
          <Link href="/renewals?filter=UPCOMING" className={`${styles.filterTab} ${currentFilter === "UPCOMING" ? styles.activeTab : ""}`}>
            Upcoming (30 days)
          </Link>
          <Link href="/renewals?filter=EXPIRED" className={`${styles.filterTab} ${currentFilter === "EXPIRED" ? styles.activeTab : ""}`}>
            Expired
          </Link>
        </div>
      </div>

      {renewals.length === 0 ? (
        <div className={styles.emptyState}>
          <RefreshCw size={48} className={styles.emptyIcon} />
          <h2>No Renewals Found</h2>
          <p>You have no renewals matching this filter.</p>
          <Link href="/renewals/new" className="btn-primary" style={{marginTop: '16px'}}>
            Add Service
          </Link>
        </div>
      ) : (
        <div className={styles.renewalList}>
          {renewals.map(renewal => {
            const isExpired = new Date(renewal.expiryDate) < new Date();
            const daysRemaining = Math.ceil((new Date(renewal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={renewal.id} className={`${styles.card} ${isExpired ? styles.expiredCard : ''}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={`${styles.typeBadge} ${styles[renewal.type.toLowerCase()] || styles.defaultType}`}>
                      {renewal.type}
                    </span>
                    <h3>{renewal.customer.name} {renewal.customer.company ? `(${renewal.customer.company})` : ''}</h3>
                  </div>
                  
                  <div className={styles.statusSection}>
                    {isExpired ? (
                      <span className={styles.expiredAlert}>
                        <AlertTriangle size={16} /> Expired
                      </span>
                    ) : daysRemaining <= 30 ? (
                      <span className={styles.upcomingAlert}>
                        <AlertTriangle size={16} /> {daysRemaining} days left
                      </span>
                    ) : (
                      <span className={styles.safeAlert}>
                        <CheckCircle size={16} /> Active
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.cardDetails}>
                  <p><strong>Expiry Date:</strong> {new Date(renewal.expiryDate).toLocaleDateString()}</p>
                </div>
                
                <div className={styles.cardActions}>
                  <Link href={`/renewals/${renewal.id}/renew`} className="btn-primary" style={{flex: 1}}>
                    <RefreshCw size={16} /> Process Renewal
                  </Link>
                  <a href={`https://wa.me/${renewal.customer.phone.replace(/[^0-9]/g, '')}`} className="btn-secondary" style={{flex: 1}} target="_blank" rel="noopener noreferrer">
                    WhatsApp Reminder
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
