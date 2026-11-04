"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, IndianRupee, Users, Monitor, 
  Repeat, RefreshCw, BarChart3, Receipt, ArrowRight,
  ShieldCheck, ExternalLink, Sparkles
} from "lucide-react";
import styles from "./ErpNavHeader.module.css";

const ERP_TABS = [
  { href: "/erp/dashboard", label: "Operations Hub", icon: LayoutDashboard },
  { href: "/erp/finance", label: "Finance & Ledgers", icon: IndianRupee },
  { href: "/erp/vendors", label: "Suppliers & Vendors", icon: Users },
  { href: "/erp/assets", label: "Company Assets", icon: Monitor },
  { href: "/erp/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/erp/integrations/aronium", label: "POS Live Sync", icon: RefreshCw },
  { href: "/erp/reports", label: "Audit Reports", icon: BarChart3 },
];

export default function ErpNavHeader() {
  const pathname = usePathname() || "";

  return (
    <div className={styles.wrapper}>
      {/* Top Banner */}
      <div className={styles.topBanner}>
        <div className={styles.brandGroup}>
          <div className={styles.erpBadge}>
            <ShieldCheck size={14} color="#7C3AED" />
            <span>CENTRALIZED ERP</span>
          </div>
          <span className={styles.brandTitle}>TechNext Enterprise Resource Planning</span>
          <span className={styles.liveSyncBadge}>
            <span className={styles.pulseDot} /> Live Cloud Sync
          </span>
        </div>

        <div className={styles.quickSuites}>
          <Link href="/billing" className={styles.suitePill} title="Open Billing & Inventory Suite">
            <Receipt size={14} color="#0284c7" />
            <span>Billing Suite</span>
          </Link>
          <Link href="/employees" className={styles.suitePill} title="Open Employee Management">
            <Users size={14} color="#10b981" />
            <span>Staff Hub</span>
          </Link>
        </div>
      </div>

      {/* Horizontal ERP Navigation Tabs */}
      <nav className={styles.tabNav}>
        {ERP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = 
            tab.href === "/erp/dashboard" 
              ? pathname === "/erp/dashboard" 
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ""}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isActive && <div className={styles.activeBar} />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
