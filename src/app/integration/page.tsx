export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Upload, RefreshCw, CheckCircle, Database, AlertCircle, Users, FileSignature, Receipt } from "lucide-react";
import styles from "./page.module.css";

export default async function IntegrationPage() {
  const [
    totalCustomers,
    syncedCustomers,
    totalQuotations,
    totalInvoices,
    recentLogs,
    settings
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { syncStatus: "SYNCED" } }),
    prisma.quotation.count(),
    prisma.aroniumReference.count({ where: { refType: "Invoice" } }),
    prisma.syncLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.systemSettings.findFirst()
  ]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Aronium Integration Center</h1>
          <p className={styles.subtitle}>Manage synchronization between TechNext CRM and Aronium POS.</p>
        </div>
        <Link href="/integration/import" className="btn-primary">
          <Upload size={20} />
          <span>Import Data</span>
        </Link>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Users size={20} className={styles.statIcon} style={{color: '#0284C7'}} />
            <span>Customers Synced</span>
          </div>
          <div className={styles.statValue}>{syncedCustomers} <span className={styles.statSub}>/ {totalCustomers}</span></div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FileSignature size={20} className={styles.statIcon} style={{color: '#16A34A'}} />
            <span>Linked Quotations</span>
          </div>
          <div className={styles.statValue}>{totalQuotations}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Receipt size={20} className={styles.statIcon} style={{color: '#D97706'}} />
            <span>Linked Invoices</span>
          </div>
          <div className={styles.statValue}>{totalInvoices}</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <RefreshCw size={20} /> Sync Logs
            </h2>
            
            {recentLogs.length === 0 ? (
              <p className={styles.textMuted}>No sync operations have been performed yet.</p>
            ) : (
              <div className={styles.logList}>
                {recentLogs.map(log => (
                  <div key={log.id} className={styles.logItem}>
                    <div className={styles.logIcon}>
                      {log.status === "SUCCESS" ? (
                        <CheckCircle size={20} className={styles.successIcon} />
                      ) : (
                        <AlertCircle size={20} className={styles.errorIcon} />
                      )}
                    </div>
                    <div className={styles.logContent}>
                      <div className={styles.logHeader}>
                        <strong>{log.type}</strong> Sync
                        <span className={styles.logDate}>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className={styles.logDetails}>{log.details}</p>
                      {log.recordsAdded > 0 && (
                        <span className={styles.logBadge}>+{log.recordsAdded} Records</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={styles.sideCol}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Database size={18} /> Auto-Sync Settings
            </h3>
            <p className={styles.textMuted} style={{marginBottom: '16px', fontSize: '13px'}}>
              Connect directly to your local Aronium SQLite database to automatically fetch new customers and quotations.
            </p>
            
            <form action={async (formData) => {
              "use server";
              const { prisma } = await import("@/lib/prisma");
              const { revalidatePath } = await import("next/cache");
              const path = formData.get("dbPath") as string;
              
              const existing = await prisma.systemSettings.findFirst();
              if (existing) {
                await prisma.systemSettings.update({
                  where: { id: existing.id },
                  data: { aroniumDbPath: path }
                });
              } else {
                await prisma.systemSettings.create({
                  data: { aroniumDbPath: path }
                });
              }
              revalidatePath("/integration");
            }}>
              <div className={styles.inputGroup} style={{marginBottom: '12px'}}>
                <label style={{display: 'block', fontSize: '12px', marginBottom: '4px'}}>Aronium Database Path</label>
                <input 
                  type="text" 
                  name="dbPath" 
                  placeholder="C:\ProgramData\Aronium\Data\aronium.db" 
                  defaultValue={settings?.aroniumDbPath || ""}
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)'}}
                />
              </div>
              <button type="submit" className="btn-secondary" style={{width: '100%', marginBottom: '24px'}}>
                Save Path
              </button>
            </form>

            <form action={async () => {
              "use server";
              const { syncCustomersFromAronium } = await import("@/lib/aroniumSync");
              const { revalidatePath } = await import("next/cache");
              try {
                await syncCustomersFromAronium();
              } catch (e) {
                console.error(e);
              }
              revalidatePath("/integration");
            }}>
              <button type="submit" className="btn-primary" style={{width: '100%'}}>
                <RefreshCw size={16} /> Force Sync Now
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
