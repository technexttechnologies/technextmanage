import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, PhoneCall, CheckCircle, Clock, Search, Filter } from "lucide-react";
import styles from "./page.module.css";
import { updateFollowUpStatus } from "./actions";

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const currentStatus = searchParams.status || "PENDING";

  const followUps = await prisma.followUp.findMany({
    where: currentStatus === "ALL" ? {} : { status: currentStatus },
    include: {
      customer: true,
      assignedTo: true
    },
    orderBy: { date: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Follow-ups</h1>
          <p className={styles.subtitle}>Scheduled calls, meetings, and touchpoints.</p>
        </div>
        <Link href="/follow-ups/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Schedule</span>
        </Link>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search follow-ups..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          <Link href="/follow-ups?status=PENDING" className={`${styles.filterTab} ${currentStatus === "PENDING" ? styles.activeTab : ""}`}>
            Upcoming / Pending
          </Link>
          <Link href="/follow-ups?status=COMPLETED" className={`${styles.filterTab} ${currentStatus === "COMPLETED" ? styles.activeTab : ""}`}>
            Completed
          </Link>
          <Link href="/follow-ups?status=ALL" className={`${styles.filterTab} ${currentStatus === "ALL" ? styles.activeTab : ""}`}>
            All
          </Link>
        </div>
      </div>

      {followUps.length === 0 ? (
        <div className={styles.emptyState}>
          <PhoneCall size={48} className={styles.emptyIcon} />
          <h2>No Follow-ups</h2>
          <p>You have no scheduled follow-ups matching this status.</p>
          <Link href="/follow-ups/new" className="btn-primary" style={{marginTop: '16px'}}>
            Schedule One Now
          </Link>
        </div>
      ) : (
        <div className={styles.followUpList}>
          {followUps.map(fu => {
            const isOverdue = new Date(fu.date) < new Date() && fu.status !== "COMPLETED";
            
            return (
              <div key={fu.id} className={`${styles.fuCard} ${styles[fu.status.toLowerCase()]}`}>
                <div className={styles.fuContent}>
                  <div className={styles.fuHeader}>
                    <span className={`${styles.typeBadge} ${styles[fu.type.toLowerCase().replace(" ", "")]}`}>
                      {fu.type}
                    </span>
                    <span className={`${styles.date} ${isOverdue ? styles.overdue : ""}`}>
                      <Clock size={14} /> {new Date(fu.date).toLocaleString()}
                    </span>
                  </div>
                  
                  <h3>{fu.customer.name} {fu.customer.company ? `(${fu.customer.company})` : ''}</h3>
                  {fu.notes && <p className={styles.notes}>{fu.notes}</p>}
                  
                  <div className={styles.contactInfo}>
                    <a href={`tel:${fu.customer.phone}`} className={styles.contactLink}>{fu.customer.phone}</a>
                    {fu.customer.email && (
                      <>
                        <span className={styles.separator}>•</span>
                        <a href={`mailto:${fu.customer.email}`} className={styles.contactLink}>{fu.customer.email}</a>
                      </>
                    )}
                  </div>
                </div>
                
                <form action={updateFollowUpStatus} className={styles.fuActions}>
                  <input type="hidden" name="followUpId" value={fu.id} />
                  
                  {fu.status === "PENDING" && (
                    <button type="submit" name="status" value="COMPLETED" className={`${styles.actionBtn} ${styles.completeBtn}`}>
                      <CheckCircle size={18} /> Mark Done
                    </button>
                  )}
                  
                  {fu.status === "COMPLETED" && (
                    <span className={styles.completedBadge}>
                      <CheckCircle size={18} /> Done
                    </span>
                  )}
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
