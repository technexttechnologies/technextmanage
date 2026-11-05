"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import styles from "./MobileHeader.module.css";
import { logout } from "@/app/login/actions";
import NotificationBell from "./NotificationBell";

export default function MobileHeader({ user }: { user?: any }) {
  if (!user) return null;

  const userEmail = (user?.email || "").toString().toLowerCase().trim();
  const userName = (user?.name || "").toString().toLowerCase().trim();
  const userId = (user?.userId || "").toString().trim();
  const isTestUser = userEmail === "test@technext" || userEmail.startsWith("test@technext") || userName === "test" || userId === "cmw2z6xpa0001y5xm4g9lp30w";

  return (
    <header className={styles.mobileHeader}>
      <div className={styles.leftSection}>
        <button 
          type="button" 
          className={styles.menuBtn}
          onClick={() => window.dispatchEvent(new Event('toggleMobileMenu'))}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        {isTestUser ? (
          <Link href="/billing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
              TP
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
              Test Portal
            </span>
          </Link>
        ) : (
          <Link href={user?.role === "SALES" ? "/sales" : "/"} className={styles.logoContainer}>
            <img 
              src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
              alt="TechNext Technologies" 
              className={styles.logo} 
            />
          </Link>
        )}
      </div>
      <div className={styles.actions}>
        <NotificationBell />
        <div className={styles.avatar}>{isTestUser ? "T" : (user?.name?.charAt(0).toUpperCase() || "U")}</div>
        <form action={logout}>
          <button type="submit" className={styles.logoutBtn} title="Log out">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
