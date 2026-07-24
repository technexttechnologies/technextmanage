import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PieChart, Download, FileText, IndianRupee, Users, Monitor, Repeat } from "lucide-react";
import styles from "../dashboard/page.module.css";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role)) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className={styles.title}><PieChart size={32} color="#8B5CF6" /> Business Reports</h1>
            <p className={styles.subtitle}>Generate and export operational and financial reports.</p>
          </div>
        </div>
      </header>

      <div className={styles.chartsGrid}>
        
        {/* Financial Reports */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}><IndianRupee size={20} color="#10B981" /> Financial Reports</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>Income Statement</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Detailed breakdown of all revenue sources.</p>
              </div>
              <button className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick="window.print()">
                <Download size={14} /> Export CSV
              </button>
            </div>
            
            <div style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>Expense Report</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Categorized company expenditures.</p>
              </div>
              <button className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick="window.print()">
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>Profit & Loss (P&L)</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Monthly and Annual P&L statement.</p>
              </div>
              <button className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick="window.print()">
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Operational Reports */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}><FileText size={20} color="#3B82F6" /> Operational Reports</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> Vendor Ledger</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Transaction history with suppliers.</p>
              </div>
              <button className="btn-secondary" style={{ padding: '6px 12px' }}><Download size={14} /></button>
            </div>

            <div style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Monitor size={16} /> Asset Register</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Complete inventory of company assets.</p>
              </div>
              <button className="btn-secondary" style={{ padding: '6px 12px' }}><Download size={14} /></button>
            </div>

            <div style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Repeat size={16} /> Subs & Renewals</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Upcoming software and service renewals.</p>
              </div>
              <button className="btn-secondary" style={{ padding: '6px 12px' }}><Download size={14} /></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
