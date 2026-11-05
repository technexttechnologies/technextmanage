export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Shield, Settings as SettingsIcon, Users, MessageSquare, CreditCard, CheckCircle } from "lucide-react";
import styles from "./page.module.css";
import { updatePlatformSettings } from "./actions";
import Link from "next/link";
import { getSession, isTestSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || isTestSession(session)) {
    redirect("/billing");
  }
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";
  if (!isAdmin) {
    redirect("/billing");
  }
  const settings = await prisma.systemSettings.findFirst();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Configure platform settings and access control.</p>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.column}>
          {isAdmin && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Shield size={20} />
                Access Control
              </h2>
              <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px'}}>
                Manage system users, reset passwords, and configure role-based access.
              </p>
              <Link href="/employees" className="btn-primary" style={{display: 'flex', justifyContent: 'center', gap: '8px'}}>
                <Users size={18} /> Manage Employees & Staff
              </Link>
            </section>
          )}

          <section className={styles.card} style={{marginTop: 'var(--spacing-6)'}}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                <CreditCard size={20} style={{ color: '#00a2ed' }} />
                Razorpay Payment Gateway
              </h2>
              <span style={{ 
                background: '#DCFCE7', 
                color: '#166534',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle size={12} color="#16a34a" /> Live Active
              </span>
            </div>
            <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '14px'}}>
              Accept online customer invoice payments with UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and NetBanking.
            </p>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Live Key ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>rzp_live_Tw8IklmHyKf7B8</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Webhook &amp; Verification:</span>
                <span style={{ color: '#166534', fontWeight: 600 }}>HMAC-SHA256 Enabled</span>
              </div>
            </div>
          </section>

          <section className={styles.card} style={{marginTop: 'var(--spacing-6)'}}>
            <h2 className={styles.cardTitle}>
              <SettingsIcon size={20} />
              Platform Configuration
            </h2>
            <form action={updatePlatformSettings} style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
              <div className={styles.inputGroup}>
                <label htmlFor="geminiApiKey">Google Gemini API Key</label>
                <input type="password" id="geminiApiKey" name="geminiApiKey" defaultValue={settings?.geminiApiKey || ""} placeholder="AIxxxxxxxxxxxxxxxxxxxx" />
              </div>
              <button type="submit" className="btn-secondary" style={{width: 'fit-content'}}>Save Settings</button>
            </form>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                <MessageSquare size={20} style={{ color: '#25D366' }} />
                WhatsApp Message Automation
              </h2>
              <span style={{ 
                background: settings?.whatsappProvider === "OFF" ? '#EFF6FF' : '#DCFCE7', 
                color: settings?.whatsappProvider === "OFF" ? '#1E40AF' : '#166534',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {settings?.whatsappProvider === "OFF" ? "1-Click Direct" : `${settings?.whatsappProvider} Active`}
              </span>
            </div>
            <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px'}}>
              Auto-send WhatsApp alerts for project progress, service requests, Google reviews, and customer portal links.
            </p>
            <Link href="/settings/whatsapp" className="btn-primary" style={{display: 'flex', justifyContent: 'center', gap: '8px', background: '#25D366', borderColor: '#25D366'}}>
              <MessageSquare size={18} /> Configure WhatsApp Automation
            </Link>
          </section>

          <section className={styles.card} style={{marginTop: 'var(--spacing-6)'}}>
            <h2 className={styles.cardTitle}>
              <SettingsIcon size={20} />
              Message Templates
            </h2>
            <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px'}}>
              Configure WhatsApp and Email templates for automated customer engagement.
            </p>
            <Link href="/settings/templates" className="btn-secondary" style={{display: 'flex', justifyContent: 'center'}}>
              Manage Communication Templates
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
