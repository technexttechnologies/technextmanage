"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Users, Target, Briefcase, PhoneCall, RefreshCw, CheckSquare, FileText, Mail, Settings, FileSignature, ShoppingCart, Database, Globe, ExternalLink, LogOut, Receipt } from "lucide-react";
import styles from "./Sidebar.module.css";
import { logout } from "@/app/login/actions";

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname() || "";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <Image src="/logo.png" alt="TechNext Logo" width={150} height={40} className={styles.logo} />
      </div>
      
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <p className={styles.navSectionTitle}>Main</p>
          <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
            <Home size={20} /> Dashboard
          </Link>
          <Link href="/customers" className={`${styles.navItem} ${pathname.startsWith('/customers') ? styles.active : ''}`}>
            <Users size={20} /> Customers
          </Link>
          <Link href="/leads" className={`${styles.navItem} ${pathname.startsWith('/leads') ? styles.active : ''}`}>
            <Target size={20} /> Leads
          </Link>
          <Link href="/enquiries" className={`${styles.navItem} ${pathname.startsWith('/enquiries') ? styles.active : ''}`}>
            <Globe size={20} /> Website Enquiries
          </Link>
          <Link href="/projects" className={`${styles.navItem} ${pathname.startsWith('/projects') ? styles.active : ''}`}>
            <Briefcase size={20} /> Projects
          </Link>
          <Link href="/quotations" className={`${styles.navItem} ${pathname.startsWith('/quotations') ? styles.active : ''}`}>
            <FileSignature size={20} /> Quotations
          </Link>
        </div>

        <div className={styles.navSection}>
          <p className={styles.navSectionTitle}>Operations</p>
          <Link href="/follow-ups" className={`${styles.navItem} ${pathname.startsWith('/follow-ups') ? styles.active : ''}`}>
            <PhoneCall size={20} /> Follow-ups
          </Link>
          <Link href="/renewals" className={`${styles.navItem} ${pathname.startsWith('/renewals') ? styles.active : ''}`}>
            <RefreshCw size={20} /> Renewals
          </Link>
          <Link href="/tasks" className={`${styles.navItem} ${pathname.startsWith('/tasks') ? styles.active : ''}`}>
            <CheckSquare size={20} /> Tasks
          </Link>
          {isAdmin && (
            <Link href="/email" className={`${styles.navItem} ${pathname === "/email" ? styles.active : ""}`}>
              <Mail size={20} />
              <span>Email System</span>
            </Link>
          )}

          <div className={styles.navSectionTitle}>Workflows</div>

          <Link href="/quotation-requests" className={`${styles.navItem} ${pathname.startsWith("/quotation-requests") ? styles.active : ""}`}>
            <FileSignature size={20} />
            <span>Quotation Requests</span>
          </Link>

          <Link href="/invoice-requests" className={`${styles.navItem} ${pathname.startsWith("/invoice-requests") ? styles.active : ""}`}>
            <Receipt size={20} />
            <span>Invoice Requests</span>
          </Link>
        </div>

        {isAdmin && (
          <div className={styles.navSection}>
            <p className={styles.navSectionTitle}>Integrations</p>
            <Link href="/aronium" className={`${styles.navItem} ${pathname.startsWith('/aronium') ? styles.active : ''}`}>
              <ShoppingCart size={20} /> Aronium POS
            </Link>
            <Link href="/integration" className={`${styles.navItem} ${pathname.startsWith('/integration') ? styles.active : ''}`}>
              <Database size={20} /> Sync Center
            </Link>
            <a href="https://technextcatlog.vercel.app/admin.html" target="_blank" rel="noopener noreferrer" className={styles.navItem}>
              <ExternalLink size={20} /> Catalog Admin ↗
            </a>
          </div>
        )}

        <div className={styles.navSection}>
          <p className={styles.navSectionTitle}>System</p>
          <Link href="/documents" className={`${styles.navItem} ${pathname.startsWith('/documents') ? styles.active : ''}`}>
            <FileText size={20} /> Documents
          </Link>
          {isAdmin && (
            <Link href="/settings" className={`${styles.navItem} ${pathname.startsWith('/settings') ? styles.active : ''}`}>
              <Settings size={20} /> Settings
            </Link>
          )}
        </div>
      </nav>
      
      <div className={styles.userProfile}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div className={styles.avatar}>{user?.name?.charAt(0) || "U"}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name || "User"}</p>
            <p className={styles.userRole}>{user?.role || "Staff"}</p>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }} title="Log out">
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </aside>
  );
}
