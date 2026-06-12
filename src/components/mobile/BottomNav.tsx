"use client";

import Link from "next/link";
import { Home, Users, Target, Briefcase, Menu } from "lucide-react";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav}>
      <Link href="/" className={styles.navItem}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link href="/customers" className={styles.navItem}>
        <Users size={24} />
        <span>Customers</span>
      </Link>
      <Link href="/leads" className={styles.navItem}>
        <Target size={24} />
        <span>Leads</span>
      </Link>
      <Link href="/projects" className={styles.navItem}>
        <Briefcase size={24} />
        <span>Projects</span>
      </Link>
      <button className={styles.navItem} aria-label="Menu" onClick={() => window.dispatchEvent(new Event('toggleMobileMenu'))}>
        <Menu size={24} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
