export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Shield, Settings as SettingsIcon, Users } from "lucide-react";
import styles from "./page.module.css";
import { updatePlatformSettings } from "./actions";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";
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
              <Link href="/settings/users" className="btn-primary" style={{display: 'flex', justifyContent: 'center', gap: '8px'}}>
                <Users size={18} /> Manage Users & Passwords
              </Link>
            </section>
          )}

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
            <h2 className={styles.cardTitle}>
              <SettingsIcon size={20} />
              Communication Settings
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
