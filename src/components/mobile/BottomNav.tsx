"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Target, Briefcase, Menu } from "lucide-react";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname() || "";

  const isHome = pathname === "/" || pathname.startsWith("/sales");
  const isCustomers = pathname.startsWith("/customers");
  const isLeads = pathname.startsWith("/leads");
  const isProjects = pathname.startsWith("/projects");

  return (
    <nav className={styles.bottomNav}>
      <Link 
        href="/" 
        className={`${styles.navItem} ${isHome ? styles.active : ""}`}
        aria-current={isHome ? "page" : undefined}
      >
        <Home size={22} className={styles.icon} />
        <span>Home</span>
      </Link>
      <Link 
        href="/customers" 
        className={`${styles.navItem} ${isCustomers ? styles.active : ""}`}
        aria-current={isCustomers ? "page" : undefined}
      >
        <Users size={22} className={styles.icon} />
        <span>Clients</span>
      </Link>
      <Link 
        href="/leads" 
        className={`${styles.navItem} ${isLeads ? styles.active : ""}`}
        aria-current={isLeads ? "page" : undefined}
      >
        <Target size={22} className={styles.icon} />
        <span>Leads</span>
      </Link>
      <Link 
        href="/projects" 
        className={`${styles.navItem} ${isProjects ? styles.active : ""}`}
        aria-current={isProjects ? "page" : undefined}
      >
        <Briefcase size={22} className={styles.icon} />
        <span>Projects</span>
      </Link>
      <button 
        type="button"
        className={styles.navItem} 
        aria-label="Toggle Navigation Menu" 
        onClick={() => window.dispatchEvent(new Event('toggleMobileMenu'))}
      >
        <Menu size={22} className={styles.icon} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
