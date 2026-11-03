export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import { 
  Users, Briefcase, RefreshCw, PhoneCall, 
  Globe, Server, Package, Calendar, 
  Shield, TrendingUp, ArrowRight,
  Receipt
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

  // Aronium Metrics
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img 
              src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
              alt="TechNext Technologies" 
              style={{ height: '36px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} 
            />
            <div style={{ height: "24px", width: "1px", backgroundColor: "var(--surface-border)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
              {todayDateString}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.6px', 
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(99, 91, 255, 0.08)',
              color: 'var(--brand-primary, #635bff)',
              border: '1px solid rgba(99, 91, 255, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Shield size={12} /> {isSuperAdmin ? "Super Admin" : "Administrator"}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              ● Cloud ERP Online
            </span>
          </div>
        </div>

        <div>
          <h1 className={styles.greeting}>Welcome back, {session.name || "Administrator"}</h1>
          <p className={styles.subtitle}>Executive Operations Dashboard • Real-time infrastructure, customer accounts, and revenue performance.</p>
        </div>
      </header>

      {/* 2. PRIMARY ENTERPRISE SUITE LAUNCHPAD CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* SUITE 1: BILLING & INVENTORY */}
        <Link 
          href="/billing"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(2, 132, 199, 0.01) 100%)",
            border: "1px solid rgba(2, 132, 199, 0.25)",
            borderRadius: "14px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            position: "relative",
            overflow: "hidden"
          }}
          className={styles.suiteCardHover}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Receipt size={22} />
              </div>
              <span style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "#0284c7",
                color: "#ffffff"
              }}>
                Full Suite
              </span>
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Billing &amp; Inventory Suite
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0", lineHeight: 1.45 }}>
              POS terminal, tax invoices, quotations, credit notes &amp; refunds, inventory stock catalog, valuation and 21 financial audit reports.
            </p>
          </div>

          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "8px",
              border: "1px solid rgba(2, 132, 199, 0.15)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0369a1",
              marginBottom: "14px"
            }}>
              <span>₹{formatCurrency(totalBilled)} Billed</span>
              <span>•</span>
              <span>{aroniumInvoices.length} Invoices</span>
              <span>•</span>
              <span>{totalProducts} Catalog Products</span>
            </div>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0284c7"
            }}>
              Open Billing &amp; Inventory Suite <ArrowRight size={15} />
            </div>
          </div>
        </Link>

        {/* SUITE 2: EMPLOYEE MANAGEMENT */}
        <Link 
          href="/employees"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(79, 70, 229, 0.01) 100%)",
            border: "1px solid rgba(79, 70, 229, 0.25)",
            borderRadius: "14px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            position: "relative",
            overflow: "hidden"
          }}
          className={styles.suiteCardHover}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Users size={22} />
              </div>
              <span style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "#4f46e5",
                color: "#ffffff"
              }}>
                HR Hub
              </span>
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Employee &amp; Staff Management
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0", lineHeight: 1.45 }}>
              Staff directory, biometric shift hours, attendance tracking, leave requests &amp; approvals, departments and portal access.
            </p>
          </div>

          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "8px",
              border: "1px solid rgba(79, 70, 229, 0.15)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#3730a3",
              marginBottom: "14px"
            }}>
              <span>{totalStaff} Staff Members</span>
              <span>•</span>
              <span>{salesStaffCount} Sales Reps</span>
              <span>•</span>
              <span>{activeStaffToday} Active Today</span>
            </div>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#4f46e5"
            }}>
              Manage Team &amp; Employees <ArrowRight size={15} />
            </div>
          </div>
        </Link>
      </div>

      {/* 3. CORE BUSINESS PERFORMANCE METRICS */}
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Link href="/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.blue}`}>
              <Users size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Active Clients</h3>
              <p className={styles.metricValue}>{totalActiveCustomers}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified enterprise accounts</span>
            </div>
          </div>
        </Link>

        <Link href="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.purple}`}>
              <Briefcase size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Client Projects</h3>
              <p className={styles.metricValue}>{projects.length}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In design, dev &amp; deployed</span>
            </div>
          </div>
        </Link>

        <Link href="/domains" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.green}`}>
              <Globe size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Managed Domains</h3>
              <p className={styles.metricValue}>{activeDomains}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active client domain assets</span>
            </div>
          </div>
        </Link>

        <Link href="/hosting" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard}>
            <div className={`${styles.iconWrapper} ${styles.blue}`}>
              <Server size={22} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Hosting Accounts</h3>
              <p className={styles.metricValue}>{hostingRenewals}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Renewals in next 30 days</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 4. ACTION-REQUIRED OPERATIONAL ALERTS GRID */}
      <div className={styles.alertsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: "24px" }}>
        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <PhoneCall size={18} />
            <h3>Today's Follow-ups</h3>
            <span className={styles.badge}>{followUpsDueToday}</span>
          </div>
          <p>{followUpsDueToday} client follow-ups scheduled for today.</p>
          <Link href="/follow-ups" className="btn-primary" style={{ marginTop: '10px', fontSize: '12.5px', padding: '6px 14px' }}>
            View Follow-ups
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.successAlert}`}>
          <div className={styles.alertHeader}>
            <Calendar size={18} />
            <h3>Today's Appointments</h3>
            <span className={styles.badge}>{upcomingMeetings}</span>
          </div>
          <p>{upcomingMeetings} client consultations scheduled for today.</p>
          <Link href="/appointments" className="btn-primary" style={{ marginTop: '10px', fontSize: '12.5px', padding: '6px 14px' }}>
            View Schedule
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.dangerAlert}`}>
          <div className={styles.alertHeader}>
            <Globe size={18} />
            <h3>Domains Expiring Soon</h3>
            <span className={styles.badge}>{domainsExpiringSoon}</span>
          </div>
          <p>{domainsExpiringSoon} client domains expiring in the next 30 days.</p>
          <Link href="/domains" className="btn-primary" style={{ marginTop: '10px', fontSize: '12.5px', padding: '6px 14px' }}>
            Review Domains
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.infoAlert}`}>
          <div className={styles.alertHeader}>
            <Server size={18} />
            <h3>Hosting Renewals Due</h3>
            <span className={styles.badge}>{hostingRenewals}</span>
          </div>
          <p>{hostingRenewals} server allocations need renewal within 30 days.</p>
          <Link href="/hosting" className="btn-primary" style={{ marginTop: '10px', fontSize: '12.5px', padding: '6px 14px' }}>
            Check Hosting
          </Link>
        </div>

        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <Package size={18} />
            <h3>Service Packages Expiring</h3>
            <span className={styles.badge}>{packageRenewals}</span>
          </div>
          <p>{packageRenewals} packages up for renewal in the next 30 days.</p>
          <Link href="/packages" className="btn-primary" style={{ marginTop: '10px', fontSize: '12.5px', padding: '6px 14px', background: "#d97706", borderColor: "#d97706" }}>
            View Packages
          </Link>
        </div>
      </div>

      {/* 5. OPERATIONAL PIPELINE & REVENUE ANALYTICS */}
      <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: 'var(--spacing-6)' }}>
        {/* Projects Pipeline Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={18} color="var(--brand-primary)" />
              <h2 style={{ fontSize: "16px", margin: 0 }}>Client Projects Pipeline</h2>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
              {projects.length} Total
            </span>
          </div>

          <div className={styles.projectList} style={{ marginTop: "14px" }}>
            {projectStatusOverview.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
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

          <Link href="/projects" className={styles.cardLink} style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            Manage All Projects <ArrowRight size={14} />
          </Link>
        </div>

        {/* 6-Month Revenue Growth */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <TrendingUp size={18} color="#10b981" />
            <h2 style={{ fontSize: "16px", margin: 0 }}>Revenue Growth (Past 6 Months)</h2>
          </div>

          <div className={styles.chartWrapper} style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 8px 8px 8px' }}>
            {revenueData.map((d) => {
              const heightPercent = Math.round((d.amount / maxRev) * 100);
              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>₹{(d.amount / 1000).toFixed(0)}k</span>
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
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-main)' }}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
