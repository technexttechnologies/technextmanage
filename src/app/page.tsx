export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import { 
  Users, Target, Briefcase, RefreshCw, PhoneCall, 
  CheckSquare, Globe, Server, Package, Calendar, 
  UserPlus, Shield, TrendingUp, Settings, ArrowRight, UserCheck, Award
} from "lucide-react";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  // SALES STAFF RESTRICTION:
  // If the user is a Sales Staff member, redirect directly to the Sales Portal Panel!
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
    pendingClientAccessCount,
    totalPendingQuotes,
    totalPendingInvoices
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
    prisma.clientAccessRequest.count({ where: { status: "PENDING" } }),
    prisma.quotationRequest.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.invoiceRequest.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
  ]);

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

  return (
    <div className={styles.dashboardContainer}>
      {/* Super Admin / Admin Header Banner */}
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <img 
            src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
            alt="TechNext Technologies" 
            style={{ height: '40px', width: 'auto', maxWidth: '190px', objectFit: 'contain' }} 
          />
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.6px', 
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(99, 91, 255, 0.12)',
            color: 'var(--brand-primary, #635bff)',
            border: '1px solid rgba(99, 91, 255, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Shield size={12} /> {session.role === "SUPER_ADMIN" ? "Super Admin Console" : "Admin Panel"}
          </span>
        </div>
        <div>
          <h1 className={styles.greeting}>Welcome back, {session.name || "Administrator"}</h1>
          <p className={styles.subtitle}>Enterprise Operations, Staff Administration & Client Infrastructure.</p>
        </div>
      </header>

      {/* SUPER ADMIN CONTROL BAR */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99, 91, 255, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)",
        border: "1px solid rgba(99, 91, 255, 0.2)",
        borderRadius: "14px",
        padding: "18px 24px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "rgba(99, 91, 255, 0.15)",
            color: "var(--brand-primary, #635bff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Shield size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
              Admin Staff Management & Fast Onboarding
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              Create staff accounts, configure sales & developer permissions, and review operations.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link 
            href="/employees?add=1" 
            className="btn-primary" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              background: "var(--brand-accent, #4F46E5)",
              padding: "9px 16px",
              fontWeight: 600
            }}
          >
            <UserPlus size={16} /> + Add Staff Member
          </Link>
          <Link 
            href="/employees" 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 14px" }}
          >
            <Users size={16} /> Staff Directory ({totalStaff})
          </Link>
          <Link 
            href="/sales" 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 14px" }}
          >
            <TrendingUp size={16} /> Sales Hub ({salesStaffCount} Reps)
          </Link>
          <Link 
            href="/sales?tab=access-requests" 
            className="btn-secondary" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "9px 14px",
              background: pendingClientAccessCount > 0 ? "rgba(245, 158, 11, 0.12)" : undefined,
              borderColor: pendingClientAccessCount > 0 ? "#f59e0b" : undefined,
              color: pendingClientAccessCount > 0 ? "#b45309" : undefined,
              fontWeight: pendingClientAccessCount > 0 ? 600 : undefined
            }}
          >
            <Shield size={16} /> Approvals {pendingClientAccessCount > 0 ? `(${pendingClientAccessCount} Pending)` : ""}
          </Link>
        </div>
      </div>

      {/* PENDING CLIENT ACCESS APPROVALS BANNER */}
      {pendingClientAccessCount > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.2)",
              color: "#b45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "15px", color: "#92400e" }}>
                  {pendingClientAccessCount} Sales Staff Client Access {pendingClientAccessCount === 1 ? "Request" : "Requests"} Awaiting Approval
                </strong>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "#fef3c7",
                  color: "#b45309",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  border: "1px solid #fde68a"
                }}>
                  ACTION REQUIRED
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Sales representatives need your approval to access masked phone numbers, emails, and credentials for assigned accounts.
              </p>
            </div>
          </div>
          <Link
            href="/sales?tab=access-requests"
            className="btn-primary"
            style={{
              background: "#d97706",
              borderColor: "#d97706",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              padding: "9px 18px",
              fontWeight: 600,
              borderRadius: "8px",
              textDecoration: "none"
            }}
          >
            Review & Approve Requests <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Total Staff Metric Card */}
        <Link href="/employees" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.metricCard} style={{ cursor: 'pointer', transition: 'transform 0.15s' }}>
            <div className={`${styles.iconWrapper} ${styles.blue}`}>
              <UserCheck size={24} />
            </div>
            <div className={styles.metricInfo}>
              <h3>Company Staff Members</h3>
              <p className={styles.metricValue}>{totalStaff}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {salesStaffCount} Sales | {activeStaffToday} Active Today
              </span>
            </div>
          </div>
        </Link>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>
            <Users size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Total Active Customers</h3>
            <p className={styles.metricValue}>{totalActiveCustomers}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CRM verified profiles</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>
            <Globe size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Active Domains</h3>
            <p className={styles.metricValue}>{activeDomains}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Managed client domains</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.purple}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Total Active Projects</h3>
            <p className={styles.metricValue}>{projects.length}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across all teams</span>
          </div>
        </div>
      </div>

      {/* Action required alerts */}
      <div className={styles.alertsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <PhoneCall size={20} />
            <h3>Today's Follow-ups</h3>
            <span className={styles.badge}>{followUpsDueToday}</span>
          </div>
          <p>You have {followUpsDueToday} follow-ups scheduled for today.</p>
          <Link href="/follow-ups" className="btn-primary" style={{marginTop: '12px'}}>View Follow-ups</Link>
        </div>

        <div className={`${styles.alertCard} ${styles.dangerAlert}`}>
          <div className={styles.alertHeader}>
            <Globe size={20} />
            <h3>Domains Expiring Soon</h3>
            <span className={styles.badge}>{domainsExpiringSoon}</span>
          </div>
          <p>{domainsExpiringSoon} domains are expiring in the next 30 days.</p>
          <Link href="/domains" className="btn-primary" style={{marginTop: '12px'}}>Review Domains</Link>
        </div>

        <div className={`${styles.alertCard} ${styles.infoAlert}`}>
          <div className={styles.alertHeader}>
            <Server size={20} />
            <h3>Hosting Renewals Due</h3>
            <span className={styles.badge}>{hostingRenewals}</span>
          </div>
          <p>{hostingRenewals} hosting accounts need renewal within 30 days.</p>
          <Link href="/hosting" className="btn-primary" style={{marginTop: '12px'}}>Check Hosting</Link>
        </div>

        <div className={`${styles.alertCard} ${styles.successAlert}`}>
          <div className={styles.alertHeader}>
            <Calendar size={20} />
            <h3>Upcoming Appointments</h3>
            <span className={styles.badge}>{upcomingMeetings}</span>
          </div>
          <p>{upcomingMeetings} appointments scheduled for today.</p>
          <Link href="/appointments" className="btn-primary" style={{marginTop: '12px'}}>View Schedule</Link>
        </div>
      </div>

      {/* Projects and Service Packages section */}
      <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: 'var(--spacing-8)' }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Briefcase size={20} />
            <h2>Projects Pipeline</h2>
          </div>
          <div className={styles.projectList}>
            {projectStatusOverview.map((item) => (
              <div key={item.status} className={styles.projectItem}>
                <span className={styles.statusLabel}>{item.status}</span>
                <span className={styles.statusCount}>{item.count}</span>
              </div>
            ))}
          </div>
          <Link href="/projects" className={styles.cardLink}>
            Manage Projects <ArrowRight size={16} />
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Package size={20} />
            <h2>Service Packages Renewals</h2>
          </div>
          <div className={styles.packageRenewalInfo}>
            <p className={styles.largeNumber}>{packageRenewals}</p>
            <p className={styles.renewalText}>Packages up for renewal in the next 30 days</p>
          </div>
          <Link href="/packages" className={styles.cardLink}>
            View Packages <ArrowRight size={16} />
          </Link>
        </div>

        {/* Sales Operations & Staff Panel */}
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#10B981" />
              <h2>Sales Operations Panel</h2>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '3px 8px', borderRadius: '12px' }}>
              {salesStaffCount} Sales Staff
            </span>
          </div>
          <div className={styles.projectList}>
            <div className={styles.projectItem}>
              <span className={styles.statusLabel}>Pending Quotations</span>
              <span className={styles.statusCount} style={{ color: totalPendingQuotes > 0 ? '#d97706' : 'inherit', fontWeight: totalPendingQuotes > 0 ? 700 : 500 }}>
                {totalPendingQuotes}
              </span>
            </div>
            <div className={styles.projectItem}>
              <span className={styles.statusLabel}>Pending Invoices</span>
              <span className={styles.statusCount} style={{ color: totalPendingInvoices > 0 ? '#d97706' : 'inherit', fontWeight: totalPendingInvoices > 0 ? 700 : 500 }}>
                {totalPendingInvoices}
              </span>
            </div>
            <div className={styles.projectItem}>
              <span className={styles.statusLabel}>Client Access Requests</span>
              <span className={styles.statusCount} style={{ color: pendingClientAccessCount > 0 ? '#ef4444' : 'inherit', fontWeight: pendingClientAccessCount > 0 ? 700 : 500 }}>
                {pendingClientAccessCount}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <Link href="/sales" className={styles.cardLink} style={{ flex: 1, minWidth: '110px', textAlign: 'center' }}>
              Sales Hub <ArrowRight size={16} />
            </Link>
            <Link href="/quotation-requests" className={styles.cardLink} style={{ flex: 1, minWidth: '110px', textAlign: 'center' }}>
              Quotes <ArrowRight size={16} />
            </Link>
            <Link href="/invoice-requests" className={styles.cardLink} style={{ flex: 1, minWidth: '110px', textAlign: 'center' }}>
              Invoices <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Revenue Overview chart */}
        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <TrendingUp size={20} />
            <h2>Revenue Trend (Past 6 Months)</h2>
          </div>
          <div className={styles.chartWrapper} style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '24px', padding: '24px 12px 12px 12px' }}>
            {revenueData.map((d) => {
              const heightPercent = Math.round((d.amount / maxRev) * 100);
              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>₹{(d.amount / 1000).toFixed(0)}k</span>
                  <div 
                    style={{ 
                      width: '100%', 
                      maxWidth: '48px', 
                      height: `${heightPercent}%`, 
                      background: 'linear-gradient(180deg, var(--brand-accent, #4F46E5) 0%, rgba(79, 70, 229, 0.35) 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s'
                    }} 
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
