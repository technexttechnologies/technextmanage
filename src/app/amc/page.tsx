export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, ShieldCheck, Calendar, IndianRupee } from "lucide-react";
import styles from "./page.module.css";
import { updateAMCStatus, deleteAMC } from "./actions";

export default async function AMCPage() {
  const amcs = await prisma.aMC.findMany({
    include: {
      customer: true,
      project: true,
    },
    orderBy: { startDate: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Annual Maintenance Contracts</h1>
          <p className={styles.subtitle}>Manage your customer AMCs.</p>
        </div>
        <Link href="/amc/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add AMC</span>
        </Link>
      </header>

      {amcs.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={48} className={styles.emptyIcon} />
          <h2>No AMCs</h2>
          <p>You haven't created any Annual Maintenance Contracts yet.</p>
          <Link href="/amc/new" className="btn-primary" style={{marginTop: '16px'}}>
            Create AMC
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {amcs.map(amc => (
            <div key={amc.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <div className={`${styles.iconWrapper} ${styles[amc.status.toLowerCase()] || styles.defaultIcon}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className={styles.amcTitle}>{amc.title}</h3>
                    <div className={styles.amcDates}>
                      <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                      {new Date(amc.startDate).toLocaleDateString()} - {new Date(amc.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={styles.headerRight}>
                  <span className={`${styles.statusBadge} ${styles[amc.status.toLowerCase()]}`}>
                    {amc.status}
                  </span>
                  <div className={styles.amount}>
                    <IndianRupee size={20} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
                    {amc.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <p><strong>Customer:</strong> <Link href={`/customers/${amc.customerId}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>{amc.customer.name} {amc.customer.company ? `(${amc.customer.company})` : ''}</Link></p>
                {amc.project && <p><strong>Project:</strong> <Link href={`/projects/${amc.projectId}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>{amc.project.name}</Link></p>}
                {amc.notes && <p className={styles.notes}>{amc.notes}</p>}
              </div>

              <div className={styles.cardActions}>
                <form action={async () => {
                  "use server";
                  await updateAMCStatus(amc.id, amc.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE');
                }}>
                  <button type="submit" className={styles.actionBtn}>
                    Mark as {amc.status === 'ACTIVE' ? 'Expired' : 'Active'}
                  </button>
                </form>
                <form action={async () => {
                  "use server";
                  await deleteAMC(amc.id);
                }}>
                  <button type="submit" className={styles.actionBtn} style={{ color: 'var(--text-danger)' }}>
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
