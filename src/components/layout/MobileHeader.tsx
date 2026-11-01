"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import styles from "./MobileHeader.module.css";
import { logout } from "@/app/login/actions";
import NotificationBell from "./NotificationBell";

export default function MobileHeader({ user }: { user?: any }) {
  if (!user) return null;

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
        <Link href={user?.role === "SALES" ? "/sales" : "/"} className={styles.logoContainer}>
          <img 
            src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
            alt="TechNext Technologies" 
            className={styles.logo} 
          />
        </Link>
      </div>
      <div className={styles.actions}>
        <NotificationBell />
        <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || "U"}</div>
        <form action={logout}>
          <button type="submit" className={styles.logoutBtn} title="Log out">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
