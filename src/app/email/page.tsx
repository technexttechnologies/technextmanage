import { prisma } from "@/lib/prisma";
import { Clock, CheckCircle, XCircle, Key } from "lucide-react";
import styles from "./page.module.css";
import { saveEmailSettings } from "./actions";
import ComposeForm from "./ComposeForm";

export default async function EmailCenterPage() {
  const [customers, settings, recentEmails, templates] = await Promise.all([
    prisma.customer.findMany({
      where: { email: { not: null, notIn: [''] } },
      orderBy: { name: 'asc' }
    }),
    prisma.systemSettings.findFirst(),
    prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.messageTemplate.findMany({ orderBy: { name: 'asc' } })
  ]);

  const isConfigured = !!(settings?.smtpEmail && settings?.smtpPassword);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Email Center</h1>
          <p className={styles.subtitle}>
            {isConfigured 
              ? '✅ Gmail SMTP connected — emails send automatically from the CRM.' 
              : '⚠️ Gmail not configured — set up below to enable auto-sending.'}
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Left: Compose Email */}
        <div className={styles.customerList}>
          {!isConfigured && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #F59E0B', padding: '20px',
              borderRadius: '12px', marginBottom: '24px'
            }}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#92400E'}}>
                <Key size={18} /> Gmail SMTP Setup
              </h3>
              <p style={{fontSize: '13px', color: '#92400E', marginBottom: '16px'}}>
                To send real emails, enter your Gmail address and an App Password.<br/>
                Go to <strong>Google Account → Security → 2-Step Verification → App Passwords</strong> to generate one.
              </p>
              <form action={saveEmailSettings}>
                <div style={{display: 'grid', gap: '12px', marginBottom: '12px'}}>
                  <input type="email" name="smtpEmail" placeholder="your-email@gmail.com" required
                    style={{padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px'}} />
                  <input type="password" name="smtpPassword" placeholder="Gmail App Password (16 chars)" required
                    style={{padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px'}} />
                </div>
                <button type="submit" className="btn-primary" style={{width: '100%'}}>
                  <Settings size={16} /> Save & Connect Gmail
                </button>
              </form>
            </div>
          )}

          <ComposeForm 
            customers={customers} 
            isConfigured={isConfigured} 
            templates={templates} 
          />

          {isConfigured && (
            <div style={{
              background: 'var(--surface-card)', border: '1px solid var(--surface-border)',
              padding: '20px', borderRadius: '12px'
            }}>
              <h3 style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase'}}>
                Connected Account
              </h3>
              <form action={saveEmailSettings} style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap'}}>
                <input type="email" name="smtpEmail" defaultValue={settings?.smtpEmail || ''} placeholder="Gmail"
                  style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)', fontSize: '13px', minWidth: '180px'}} />
                <input type="password" name="smtpPassword" defaultValue={settings?.smtpPassword || ''} placeholder="App Password"
                  style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)', fontSize: '13px', minWidth: '140px'}} />
                <button type="submit" className="btn-secondary" style={{whiteSpace: 'nowrap'}}>Update</button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Email Log */}
        <div className={styles.instructionsPanel}>
          <div className={styles.card}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
              <Clock size={18} /> Email Log
            </h3>

            {recentEmails.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>No emails sent yet.</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {recentEmails.map(log => (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '12px', background: 'var(--surface-background)',
                    borderRadius: '8px', border: '1px solid var(--surface-border)'
                  }}>
                    {log.status === 'SENT' 
                      ? <CheckCircle size={16} style={{color: '#16A34A', flexShrink: 0, marginTop: '2px'}} />
                      : <XCircle size={16} style={{color: '#DC2626', flexShrink: 0, marginTop: '2px'}} />
                    }
                    <div style={{flex: 1, overflow: 'hidden'}}>
                      <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {log.subject}
                      </div>
                      <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                        To: {log.to}
                      </div>
                      <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      {log.error && (
                        <div style={{fontSize: '11px', color: '#DC2626', marginTop: '4px'}}>
                          Error: {log.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.card} style={{marginTop: '16px'}}>
            <h3 style={{marginBottom: '8px'}}>🤖 Auto-Reminders Active</h3>
            <p style={{fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6}}>
              The CRM automatically sends reminder emails:<br/>
              • <strong>Follow-up reminders</strong> — 1 day before<br/>
              • <strong>Renewal alerts</strong> — 7 days before expiry<br/>
              • <strong>Stale quotation alerts</strong> — if pending &gt; 3 days<br/><br/>
              Reminders run every 6 hours in the background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
