"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  Home, Users, Target, Briefcase, PhoneCall, RefreshCw, 
  CheckSquare, FileText, Mail, Settings, FileSignature, 
  ShoppingCart, Database, Globe, ExternalLink, LogOut, 
  Receipt, HeadphonesIcon, Calendar, MonitorPlay, IndianRupee, 
  Megaphone, LayoutDashboard, CreditCard, Monitor, Repeat, 
  Folder, PieChart, X, UserCheck, Clock, CalendarCheck, 
  Shield, TrendingUp, UserPlus, ShieldCheck, MessageSquare,
  Package, History, BarChart3, Plus
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { logout } from "@/app/login/actions";
import NotificationBell from "./NotificationBell";

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname() || "";
  const isSalesStaff = user?.role === "SALES";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || user?.role === "ADMIN";
  const isErpAccess = isAdmin || ["ACCOUNTS", "OPERATIONS", "HR"].includes(user?.role);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggleMobileMenu', handler);
    return () => window.removeEventListener('toggleMobileMenu', handler);
  }, []);

  // Close sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <div 
        className={`${styles.overlay} ${isMobileOpen ? styles.show : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      />
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.logoContainer} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Link href={isSalesStaff ? "/sales" : "/"} style={{ display: 'inline-flex' }}>
              <img 
                src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
                alt="TechNext Technologies" 
                className={styles.logo} 
              />
            </Link>
            <button 
              type="button" 
              className={styles.closeBtn} 
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '6px',
            background: isSalesStaff ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.08)',
            color: isSalesStaff ? '#059669' : '#4338ca',
            border: isSalesStaff ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(79, 70, 229, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isSalesStaff ? (
              <>
                <TrendingUp size={12} /> Sales Operations Portal
              </>
            ) : isSuperAdmin ? (
              <>
                <Shield size={12} /> Super Admin Console
              </>
            ) : (
              <>
                <ShieldCheck size={12} /> Admin Panel
              </>
            )}
          </span>
        </div>
      
        <nav className={styles.nav}>
          {/* ===================== 1. SALES STAFF ONLY NAVIGATION ===================== */}
          {isSalesStaff ? (
            <>
              <div className={styles.navSection}>
                <p className={styles.navSectionTitle} style={{ color: "#10B981" }}>Sales Workspace</p>
                <Link href="/sales" className={`${styles.navItem} ${pathname === '/sales' ? styles.active : ''}`}>
                  <TrendingUp size={19} /> Sales Operations Hub
                </Link>

                {/* SINGLE SEPARATE BUTTON FOR BILLING & INVENTORY */}
                <Link 
                  href="/billing" 
                  className={`${styles.suiteBtn} ${styles.suiteBtnBilling} ${pathname.startsWith('/billing') ? styles.suiteBtnBillingActive : ''}`}
                  title="Billing & Inventory Suite"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Receipt size={18} />
                    <span>Billing &amp; Inventory</span>
                  </div>
                  <span className={styles.suiteBadge}>Suite</span>
                </Link>
              </div>

              <div className={styles.navSection}>
                <p className={styles.navSectionTitle}>Clients &amp; Pipeline</p>
                <Link href="/customers" className={`${styles.navItem} ${pathname.startsWith('/customers') ? styles.active : ''}`}>
                  <Users size={19} /> Customer Directory
                </Link>
                <Link href="/leads" className={`${styles.navItem} ${pathname.startsWith('/leads') ? styles.active : ''}`}>
                  <Target size={19} /> Leads &amp; Deals
                </Link>
                <Link href="/projects" className={`${styles.navItem} ${pathname.startsWith('/projects') ? styles.active : ''}`}>
                  <Briefcase size={19} /> Projects Handover
                </Link>
                <Link href="/enquiries" className={`${styles.navItem} ${pathname.startsWith('/enquiries') ? styles.active : ''}`}>
                  <Globe size={19} /> Website Enquiries
                </Link>
                <Link href="/follow-ups" className={`${styles.navItem} ${pathname.startsWith('/follow-ups') ? styles.active : ''}`}>
                  <PhoneCall size={19} /> Client Follow-ups
                </Link>
                <Link href="/appointments" className={`${styles.navItem} ${pathname.startsWith('/appointments') ? styles.active : ''}`}>
                  <Calendar size={19} /> Appointments
                </Link>
                <Link href="/tickets" className={`${styles.navItem} ${pathname.startsWith('/tickets') ? styles.active : ''}`}>
                  <HeadphonesIcon size={19} /> Support Tickets
                </Link>
              </div>

              <div className={styles.navSection}>
                <p className={styles.navSectionTitle} style={{ color: "#3B82F6" }}>Staff Workspace</p>
                <Link href="/employees/portal" className={`${styles.navItem} ${pathname.startsWith('/employees/portal') ? styles.active : ''}`}>
                  <UserCheck size={19} /> My Work Portal &amp; Shift
                </Link>
              </div>
            </>
          ) : (
            /* ===================== 2. SUPER ADMIN & ADMIN NAVIGATION ===================== */
            <>
              {/* PRIMARY CORE WORKSPACE & SEPARATE SUITE BUTTONS */}
              <div className={styles.navSection}>
                <p className={styles.navSectionTitle}>Enterprise Workspace</p>
                <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
                  <Home size={19} /> Executive Dashboard
                </Link>

                {/* 1. SEPARATE SINGLE BUTTON FOR BILLING & INVENTORY */}
                <Link 
                  href="/billing" 
                  className={`${styles.suiteBtn} ${styles.suiteBtnBilling} ${pathname.startsWith('/billing') ? styles.suiteBtnBillingActive : ''}`}
                  title="Complete Billing & Inventory Suite (POS Terminal, Invoices, Quotations, Stock Catalog & 21 Sales Reports)"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Receipt size={18} />
                    <span>Billing &amp; Inventory</span>
                  </div>
                  <span className={styles.suiteBadge}>Suite</span>
                </Link>

                {/* 2. SEPARATE SINGLE BUTTON FOR EMPLOYEE MANAGEMENT */}
                <Link 
                  href="/employees" 
                  className={`${styles.suiteBtn} ${styles.suiteBtnEmployee} ${pathname.startsWith('/employees') && !pathname.includes('/portal') ? styles.suiteBtnEmployeeActive : ''}`}
                  title="Complete Employee Management (Staff Directory, Biometric Attendance, Shift Hours, Leaves & Departments)"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Users size={18} />
                    <span>Employee Management</span>
                  </div>
                  <span className={styles.suiteBadge}>HR Hub</span>
                </Link>
              </div>

              {/* CRM, PIPELINE & SALES */}
              <div className={styles.navSection}>
                <p className={styles.navSectionTitle}>Clients &amp; Pipeline</p>
                <Link href="/sales" className={`${styles.navItem} ${pathname.startsWith('/sales') ? styles.active : ''}`}>
                  <TrendingUp size={19} /> Sales Operations Hub
                </Link>
                <Link href="/customers" className={`${styles.navItem} ${pathname.startsWith('/customers') ? styles.active : ''}`}>
                  <Users size={19} /> Customers
                </Link>
                <Link href="/leads" className={`${styles.navItem} ${pathname.startsWith('/leads') ? styles.active : ''}`}>
                  <Target size={19} /> Leads &amp; Deals
                </Link>
                <Link href="/projects" className={`${styles.navItem} ${pathname.startsWith('/projects') ? styles.active : ''}`}>
                  <Briefcase size={19} /> Projects
                </Link>
                <Link href="/enquiries" className={`${styles.navItem} ${pathname.startsWith('/enquiries') ? styles.active : ''}`}>
                  <Globe size={19} /> Website Enquiries
                </Link>
              </div>

              {/* DIGITAL ASSETS & HOSTING */}
              <div className={styles.navSection}>
                <p className={styles.navSectionTitle}>Digital Assets &amp; Services</p>
                <Link href="/domains" className={`${styles.navItem} ${pathname.startsWith('/domains') ? styles.active : ''}`}>
                  <Globe size={19} /> Domains
                </Link>
                <Link href="/hosting" className={`${styles.navItem} ${pathname.startsWith('/hosting') ? styles.active : ''}`}>
                  <Database size={19} /> Hosting Accounts
                </Link>
                <Link href="/renewals" className={`${styles.navItem} ${pathname.startsWith('/renewals') ? styles.active : ''}`}>
                  <RefreshCw size={19} /> Renewals &amp; AMC
                </Link>
                <Link href="/packages" className={`${styles.navItem} ${pathname.startsWith('/packages') ? styles.active : ''}`}>
                  <Briefcase size={19} /> Service Packages
                </Link>
              </div>

              {/* CLIENT ENGAGEMENT & OPERATIONS */}
              <div className={styles.navSection}>
                <p className={styles.navSectionTitle}>Operations &amp; Support</p>
                <Link href="/appointments" className={`${styles.navItem} ${pathname.startsWith('/appointments') ? styles.active : ''}`}>
                  <Calendar size={19} /> Appointments
                </Link>
                <Link href="/follow-ups" className={`${styles.navItem} ${pathname.startsWith('/follow-ups') ? styles.active : ''}`}>
                  <PhoneCall size={19} /> Follow-ups
                </Link>
                <Link href="/tickets" className={`${styles.navItem} ${pathname.startsWith('/tickets') ? styles.active : ''}`}>
                  <HeadphonesIcon size={19} /> Support Tickets
                </Link>
                <Link href="/email" className={`${styles.navItem} ${pathname === "/email" ? styles.active : ""}`}>
                  <Mail size={19} />
                  <span>Email System</span>
                </Link>
              </div>

              {/* SYSTEM INTEGRATIONS & SETTINGS */}
              <div className={styles.navSection}>
                <p className={styles.navSectionTitle}>Integrations &amp; Settings</p>
                <Link href="/integration" className={`${styles.navItem} ${pathname.startsWith('/integration') ? styles.active : ''}`}>
                  <Database size={19} /> Sync Center
                </Link>
                <Link href="/settings/whatsapp" className={`${styles.navItem} ${pathname === '/settings/whatsapp' ? styles.active : ''}`}>
                  <MessageSquare size={19} style={{ color: "#25D366" }} /> WhatsApp Automation
                </Link>
                <Link href="/settings" className={`${styles.navItem} ${pathname.startsWith('/settings') && pathname !== '/settings/whatsapp' ? styles.active : ''}`}>
                  <Settings size={19} /> System Settings
                </Link>
              </div>
            </>
          )}
        </nav>
        
        {/* User Profile */}
        <div className={styles.userProfile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className={styles.avatar}>{user?.name?.charAt(0) || "U"}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name || "User"}</p>
              <p className={styles.userRole}>
                {isSalesStaff ? "Sales Executive" : isSuperAdmin ? "Super Admin" : (user?.role || "Staff")}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
            <form action={logout}>
              <button type="submit" style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }} title="Log out">
                <LogOut size={20} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
