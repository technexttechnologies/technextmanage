export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import { 
  Users, Briefcase, PhoneCall, 
  Globe, Server, Package, Calendar, 
  Shield, TrendingUp, ArrowRight,
  Receipt, Plus, UserPlus
} from "lucide-react";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  // SALES STAFF RESTRICTION:
  if (session.role === "SALES") {
    redirect("/sales");
  }

  const isSuperAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  // Dashboard queries
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const [
    totalActiveCustomers,
    activeDomains,
    domainsExpiringSoon,
    hostingRenewals,
    upcomingMeetings,
    followUpsDueToday,
    packageRenewals,
    projects,
    totalStaff,
    salesStaffCount,
    activeStaffToday,
    totalProducts,
    aroniumInvoices,
  ] = await Promise.all([
    prisma.customer.count({ where: { status: { not: "INACTIVE" } } }),
    prisma.domainRegistration.count({ where: { status: "ACTIVE" } }),
    prisma.domainRegistration.count({ 
      where: { 
        OR: [
          { status: "EXPIRING_SOON" },
          { expiryDate: { lte: thirtyDaysFromNow, gte: new Date() } }
        ]
      } 
    }),
    prisma.hostingAccount.count({
      where: { renewalDate: { lte: thirtyDaysFromNow, gte: new Date() } }
    }),
    prisma.appointment.count({
      where: { date: { gte: todayStart } }
    }),
    prisma.followUp.count({
      where: {
        status: "PENDING",
        date: { gte: todayStart, lt: todayEnd }
      }
    }),
    prisma.servicePackage.count({
      where: { renewalDate: { lte: thirtyDaysFromNow, gte: new Date() } }
    }),
    prisma.project.findMany({ select: { status: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "SALES", isActive: true } }),
    prisma.attendance.count({ where: { date: todayStart } }),
    prisma.erpProduct.count(),
    prisma.invoiceRequest.findMany({
      select: { amountRequested: true, structuredData: true },
    })
  ]);

  // Aronium Metrics (Strictly Invoices Only)
  const totalBilled = aroniumInvoices.reduce((sum, inv) => {
    const sData = (inv.structuredData as any) || {};
    return sum + (sData.totalAmount || inv.amountRequested || 0);
  }, 0);

  // Project Status Overview
  const projectStatusCounts = projects.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectStatusOverview = Object.entries(projectStatusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count
  }));

  // Revenue chart data
  const revenueData = [
    { month: "Jan", amount: 150000 },
    { month: "Feb", amount: 220000 },
    { month: "Mar", amount: 180000 },
    { month: "Apr", amount: 350000 },
    { month: "May", amount: 410000 },
    { month: "Jun", amount: 290000 },
  ];
  const maxRev = Math.max(...revenueData.map(d => d.amount));

  const formatCurrency = (amt: number) => {
    return Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const todayDateString = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Executive Top Header */}
      <header className={styles.header}>
        <div className={styles.headerTopBar}>
          <div className={styles.headerBrand}>
            <img 
              src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
              alt="TechNext Technologies" 
              className={styles.headerLogo}
            />
            <div className={styles.headerDivider} />
            <span className={styles.headerDate}>
              {todayDateString}
            </span>
          </div>

          <div className={styles.headerBadges}>
            <span className={styles.badgeRole}>
              <Shield size={12} /> {isSuperAdmin ? "Super Admin" : "Administrator"}
            </span>
            <span className={styles.badgeStatus}>
              ● Cloud ERP Online
            </span>
          </div>
        </div>

        <div>
          <h1 className={styles.greeting}>Welcome back, {session.name || "Administrator"}</h1>
          <p className={styles.subtitle}>Executive Operations Dashboard • Real-time infrastructure, customer accounts, and revenue performance.</p>
        </div>
      </header>

      {/* Quick Action Shortcuts Strip for Mobile & Touch screens */}
      <div className={styles.quickActionsStrip}>
        <Link href="/billing/new?type=invoice" className={styles.quickActionPill}>
          <Plus size={14} color="#0284c7" />
          <span>New Bill</span>
        </Link>
        <Link href="/customers/new" className={styles.quickActionPill}>
          <UserPlus size={14} color="#6366f1" />
          <span>Add Client</span>
        </Link>
        <Link href="/employees?add=1" className={styles.quickActionPill}>
          <Users size={14} color="#10b981" />
          <span>Add Staff</span>
        </Link>
        <Link href="/projects/new" className={styles.quickActionPill}>
          <Briefcase size={14} color="#f59e0b" />
          <span>New Project</span>
        </Link>
      </div>

      {/* 2. PRIMARY ENTERPRISE SUITE LAUNCHPAD CARDS */}
      <div className={styles.suiteGrid}>
        {/* SUITE 1: BILLING & INVENTORY */}
        <Link 
          href="/billing"
          className={`${styles.suiteCard} ${styles.suiteBilling}`}
        >
          <div>
            <div className={styles.suiteCardHeader}>
              <div className={`${styles.suiteIconWrapper} ${styles.suiteIconBilling}`}>
                <Receipt size={22} />
              </div>
              <span className={`${styles.suiteBadge} ${styles.suiteBadgeBilling}`}>
                Full Suite
              </span>
            </div>

            <h3 className={styles.suiteTitle}>
              Billing &amp; Inventory Suite
            </h3>
            <p className={styles.suiteDesc}>
              POS terminal, tax invoices, quotations, credit notes &amp; refunds, inventory stock catalog, valuation and 21 financial audit reports.
            </p>
          </div>

          <div>
            <div className={`${styles.suiteChipsRow} ${styles.suiteChipsRowBilling}`}>
              <span className={styles.suiteChip}>₹{formatCurrency(totalBilled)} Billed</span>
              <span className={styles.suiteChipDot}>•</span>
              <span className={styles.suiteChip}>{aroniumInvoices.length} Invoices</span>
              <span className={styles.suiteChipDot}>•</span>
              <span className={styles.suiteChip}>{totalProducts} Catalog Products</span>
            </div>

            <div className={`${styles.suiteActionBtn} ${styles.suiteActionBtnBilling}`}>
              Open Billing &amp; Inventory Suite <ArrowRight size={15} />
            </div>
          </div>
        </Link>

        {/* SUITE 2: EMPLOYEE MANAGEMENT */}
        <Link 
          href="/employees"
          className={`${styles.suiteCard} ${styles.suiteEmployee}`}
        >
          <div>
            <div className={styles.suiteCardHeader}>
              <div className={`${styles.suiteIconWrapper} ${styles.suiteIconEmployee}`}>
                <Users size={22} />
              </div>
              <span className={`${styles.suiteBadge} ${styles.suiteBadgeEmployee}`}>
                HR Hub
              </span>
            </div>

            <h3 className={styles.suiteTitle}>
              Employee &amp; Staff Management
            </h3>
            <p className={styles.suiteDesc}>
              Staff directory, biometric shift hours, attendance tracking, leave requests &amp; approvals, departments and portal access.
            </p>
          </div>

          <div>
            <div className={`${styles.suiteChipsRow} ${styles.suiteChipsRowEmployee}`}>
              <span className={styles.suiteChip}>{totalStaff} Staff Members</span>
              <span className={styles.suiteChipDot}>•</span>
              <span className={styles.suiteChip}>{salesStaffCount} Sales Reps</span>
              <span className={styles.suiteChipDot}>•</span>
              <span className={styles.suiteChip}>{activeStaffToday} Active Today</span>
            </div>

            <div className={`${styles.suiteActionBtn} ${styles.suiteActionBtnEmployee}`}>
              Manage Team &amp; Employees <ArrowRight size={15} />
            </div>
          </div>
        </Link>
      </div>

      {/* 3. CORE BUSINESS PERFORMANCE METRICS */}
      <div className={styles.metricsGrid}>
        <Link href="/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperBlue}`}>
              <Users size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Active Clients</h3>
              <p className={styles.metricValue}>{totalActiveCustomers}</p>
              <span className={styles.metricSubtitle}>Verified enterprise accounts</span>
            </div>
          </div>
        </Link>

        <Link href="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperPurple}`}>
              <Briefcase size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Client Projects</h3>
              <p className={styles.metricValue}>{projects.length}</p>
              <span className={styles.metricSubtitle}>In design, dev &amp; deployed</span>
            </div>
          </div>
        </Link>

        <Link href="/domains" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperGreen}`}>
              <Globe size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Managed Domains</h3>
              <p className={styles.metricValue}>{activeDomains}</p>
              <span className={styles.metricSubtitle}>Active client domain assets</span>
            </div>
          </div>
        </Link>

        <Link href="/hosting" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
              <Server size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Hosting Accounts</h3>
              <p className={styles.metricValue}>{hostingRenewals}</p>
              <span className={styles.metricSubtitle}>Renewals in next 30 days</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 4. ACTION-REQUIRED OPERATIONAL ALERTS GRID */}
      <div className={styles.alertsGrid}>
        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <PhoneCall size={18} />
            <h3>Today's Follow-ups</h3>
            <span className={styles.badgeAlertCount}>{followUpsDueToday}</span>
          </div>
          <p>{followUpsDueToday} client follow-ups scheduled for today.</p>
          <Link href="/follow-ups" className={`${styles.alertBtn} ${styles.alertBtnAmber}`}>
            View Follow-ups
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.successAlert}`}>
          <div className={styles.alertHeader}>
            <Calendar size={18} />
            <h3>Today's Appointments</h3>
            <span className={styles.badgeAlertCount}>{upcomingMeetings}</span>
          </div>
          <p>{upcomingMeetings} client consultations scheduled for today.</p>
          <Link href="/appointments" className={`${styles.alertBtn} ${styles.alertBtnPrimary}`}>
            View Schedule
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.dangerAlert}`}>
          <div className={styles.alertHeader}>
            <Globe size={18} />
            <h3>Domains Expiring Soon</h3>
            <span className={styles.badgeAlertCount}>{domainsExpiringSoon}</span>
          </div>
          <p>{domainsExpiringSoon} client domains expiring in the next 30 days.</p>
          <Link href="/domains" className={`${styles.alertBtn} ${styles.alertBtnDanger}`}>
            Review Domains
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.infoAlert}`}>
          <div className={styles.alertHeader}>
            <Server size={18} />
            <h3>Hosting Renewals Due</h3>
            <span className={styles.badgeAlertCount}>{hostingRenewals}</span>
          </div>
          <p>{hostingRenewals} server allocations need renewal within 30 days.</p>
          <Link href="/hosting" className={`${styles.alertBtn} ${styles.alertBtnPrimary}`}>
            Check Hosting
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <Package size={18} />
            <h3>Service Packages Expiring</h3>
            <span className={styles.badgeAlertCount}>{packageRenewals}</span>
          </div>
          <p>{packageRenewals} packages up for renewal in the next 30 days.</p>
          <Link href="/packages" className={`${styles.alertBtn} ${styles.alertBtnAmber}`}>
            View Packages
          </Link>
        </div>
      </div>

      {/* 5. OPERATIONAL PIPELINE & REVENUE ANALYTICS */}
      <div className={styles.sectionGrid}>
        {/* Projects Pipeline Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={18} color="var(--brand-primary, #6366f1)" />
              <h2>Client Projects Pipeline</h2>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
              {projects.length} Total
            </span>
          </div>

          <div className={styles.projectList}>
            {projectStatusOverview.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", textAlign: "center", padding: "16px 0" }}>
                No active projects recorded.
              </p>
            ) : (
              projectStatusOverview.map((item) => (
                <div key={item.status} className={styles.projectItem}>
                  <span className={styles.statusLabel}>{item.status}</span>
                  <span className={styles.statusCount}>{item.count}</span>
                </div>
              ))
            )}
          </div>

          <Link href="/projects" className={styles.cardLink}>
            Manage All Projects <ArrowRight size={14} />
          </Link>
        </div>

        {/* 6-Month Revenue Growth */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <TrendingUp size={18} color="#10b981" />
            <h2>Revenue Growth (Past 6 Months)</h2>
          </div>

          <div className={styles.chartWrapper}>
            {revenueData.map((d) => {
              const heightPercent = Math.round((d.amount / maxRev) * 100);
              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>₹{(d.amount / 1000).toFixed(0)}k</span>
                  <div 
                    style={{ 
                      width: '100%', 
                      maxWidth: '42px', 
                      height: `${heightPercent}%`, 
                      background: 'linear-gradient(180deg, var(--brand-accent, #4F46E5) 0%, rgba(79, 70, 229, 0.35) 100%)',
                      borderRadius: '5px 5px 0 0',
                      transition: 'height 0.3s'
                    }} 
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
