"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, TrendingUp, Receipt, Menu } from "lucide-react";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname() || "";

  const isHome = pathname === "/";
  const isBilling = pathname.startsWith("/billing");
  const isEmployees = pathname.startsWith("/employees");
  const isCustomers = pathname.startsWith("/customers");

  return (
    <nav className={styles.bottomNav}>
      <Link 
        href="/" 
        className={`${styles.navItem} ${isHome ? styles.active : ""}`}
        aria-current={isHome ? "page" : undefined}
      >
        <Home size={20} className={styles.icon} />
        <span>Home</span>
      </Link>
      <Link 
        href="/billing" 
        className={`${styles.navItem} ${isBilling ? styles.active : ""}`}
        aria-current={isBilling ? "page" : undefined}
      >
        <Receipt size={20} className={styles.icon} />
        <span>Billing</span>
      </Link>
      <Link 
        href="/employees" 
        className={`${styles.navItem} ${isEmployees ? styles.active : ""}`}
        aria-current={isEmployees ? "page" : undefined}
      >
        <Users size={20} className={styles.icon} />
        <span>Staff</span>
      </Link>
      <Link 
        href="/customers" 
        className={`${styles.navItem} ${isCustomers ? styles.active : ""}`}
        aria-current={isCustomers ? "page" : undefined}
      >
        <Users size={20} className={styles.icon} />
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
