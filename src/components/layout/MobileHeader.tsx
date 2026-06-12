"use client";

import { LogOut } from "lucide-react";
import styles from "./MobileHeader.module.css";
import { logout } from "@/app/login/actions";

export default function MobileHeader({ user }: { user?: any }) {
  if (!user) return null;

  return (
    <header className={styles.mobileHeader}>
      <div className={styles.logoContainer}>
        <img 
          src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" 
          alt="TECHNEXT Logo" 
          className={styles.logo} 
        />
      </div>
      <div className={styles.actions}>
        <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || "U"}</div>
        <form action={logout}>
          <button type="submit" className={styles.logoutBtn} title="Log out">
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
