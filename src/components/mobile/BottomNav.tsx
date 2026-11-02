"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, TrendingUp, Receipt, Menu } from "lucide-react";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname() || "";

  const isHome = pathname === "/";
  const isSales = pathname.startsWith("/sales");
  const isBilling = pathname.startsWith("/billing") || pathname.startsWith("/management");
  const isCustomers = pathname.startsWith("/customers");

  return (
    <nav className={styles.bottomNav}>
      <Link 
        href="/" 
        className={`${styles.navItem} ${isHome ? styles.active : ""}`}
        aria-current={isHome ? "page" : undefined}
      >
        <Home size={21} className={styles.icon} />
        <span>Home</span>
      </Link>
      <Link 
        href="/sales" 
        className={`${styles.navItem} ${isSales ? styles.active : ""}`}
        aria-current={isSales ? "page" : undefined}
      >
        <TrendingUp size={21} className={styles.icon} />
        <span>Sales</span>
      </Link>
      <Link 
        href="/billing" 
        className={`${styles.navItem} ${isBilling ? styles.active : ""}`}
        aria-current={isBilling ? "page" : undefined}
      >
        <Receipt size={21} className={styles.icon} />
        <span>Billing</span>
      </Link>
      <Link 
        href="/customers" 
        className={`${styles.navItem} ${isCustomers ? styles.active : ""}`}
        aria-current={isCustomers ? "page" : undefined}
      >
        <Users size={21} className={styles.icon} />
        <span>Clients</span>
      </Link>
      <button 
        type="button"
        className={styles.navItem} 
        aria-label="Toggle Navigation Menu" 
        onClick={() => window.dispatchEvent(new Event('toggleMobileMenu'))}
      >
        <Menu size={21} className={styles.icon} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
