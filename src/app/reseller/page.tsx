export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Server, MonitorPlay, ShieldAlert, ArrowRight, CheckCircle } from "lucide-react";
import styles from "./page.module.css";

export default async function ResellerDashboard() {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // 1. Fetch Projects with Software Licenses
  const softwareProjects = await prisma.project.findMany({
    where: {
      licenseKey: { not: null }
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Fetch Hardware Assets nearing warranty expiration (or expired)
  const expiringHardware = await prisma.projectHardware.findMany({
    where: {
      warrantyEnd: {
        not: null
      }
    },
    include: { project: { include: { customer: true } } },
    orderBy: { warrantyEnd: 'asc' }
  });

  // Filter hardware expiring within 30 days or already expired
  const criticalHardware = expiringHardware.filter(hw => {
    if (!hw.warrantyEnd) return false;
    return hw.warrantyEnd <= thirtyDaysFromNow;
  });

  // 3. Fetch Projects with AMC expiring within 30 days or expired
  const expiringAMCs = await prisma.project.findMany({
    where: {
      warrantyEndDate: {
        lte: thirtyDaysFromNow
      }
    },
    include: { customer: true },
    orderBy: { warrantyEndDate: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <MonitorPlay size={32} color="var(--brand-primary)" />
          Reseller Dashboard
        </h1>
      </header>

      <div className={styles.grid}>
        {/* Software Licenses */}
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <Server size={20} /> Managed Software Licenses
          </h2>
          {softwareProjects.length === 0 ? (
            <div className={styles.emptyState}>No tracked software licenses found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project / Client</th>
                  <th>Software</th>
                  <th>License Key</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {softwareProjects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{fontWeight: 500}}>{p.name}</div>
                      <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{p.customer?.name}</div>
                    </td>
                    <td>{p.softwareVersion || p.type}</td>
                    <td>
                      <code style={{background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>
                        {p.licenseKey}
                      </code>
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <Link href={`/projects/${p.id}`} className={styles.actionLink}>
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Expiring AMC / Support */}
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <ShieldAlert size={20} color="#EF4444" /> Expiring Software AMCs / Support
          </h2>
          {expiringAMCs.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle size={32} color="#10B981" style={{marginBottom: '12px'}} />
              <p>All AMCs are up to date!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>AMC / Support End</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expiringAMCs.map(p => {
                  const isExpired = p.warrantyEndDate && new Date(p.warrantyEndDate) < today;
                  return (
                    <tr key={p.id}>
                      <td style={{fontWeight: 500}}>{p.name}</td>
                      <td>{p.customer?.name}</td>
                      <td>
                        <span className={`${styles.tag} ${isExpired ? styles.tagDanger : styles.tagWarning}`}>
                          {p.warrantyEndDate ? new Date(p.warrantyEndDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td style={{textAlign: 'right'}}>
                        <Link href={`/projects/${p.id}`} className={styles.actionLink}>
                          View <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Expiring Hardware Warranty */}
        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <h2 className={styles.cardHeader}>
            <ShieldAlert size={20} color="#F59E0B" /> Hardware Warranties (Expiring & Expired)
          </h2>
          {criticalHardware.length === 0 ? (
            <div className={styles.emptyState}>No hardware warranties expiring within 30 days.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item / Serial No.</th>
                  <th>Project / Client</th>
                  <th>Warranty End</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {criticalHardware.map(hw => {
                  const isExpired = hw.warrantyEnd && new Date(hw.warrantyEnd) < today;
                  return (
                    <tr key={hw.id}>
                      <td>
                        <div style={{fontWeight: 500}}>{hw.itemName}</div>
                        {hw.serialNo && <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>S/N: {hw.serialNo}</div>}
                      </td>
                      <td>
                        <div>{hw.project.name}</div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{hw.project.customer?.name}</div>
                      </td>
                      <td>
                        <span className={`${styles.tag} ${isExpired ? styles.tagDanger : styles.tagWarning}`}>
                          {hw.warrantyEnd ? new Date(hw.warrantyEnd).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td style={{textAlign: 'right'}}>
                        <Link href={`/projects/${hw.projectId}`} className={styles.actionLink}>
                          View <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
