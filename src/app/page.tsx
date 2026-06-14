export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { Users, Target, Briefcase, RefreshCw, PhoneCall, CheckSquare, Globe, Server, Package, Calendar } from "lucide-react";
import Link from "next/link";

export default async function Dashboard() {
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
    projects
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
    prisma.project.findMany({ select: { status: true } })
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

  // Mock data for 6 months revenue
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
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{ width: '140px', height: 'auto' }} />
        </div>
        <div>
          <h1 className={styles.greeting}>Welcome back, Admin 👋</h1>
          <p className={styles.subtitle}>Here is what's happening at Technext today.</p>
        </div>
      </header>

      {/* Main Metrics Grid */}
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>
            <Users size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Total Active Customers</h3>
            <p className={styles.metricValue}>{totalActiveCustomers}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>
            <Globe size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Active Domains</h3>
            <p className={styles.metricValue}>{activeDomains}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.purple}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Project Status Overview</h3>
            <p className={styles.metricValue}>{projects.length}</p>
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
          <p>You have {domainsExpiringSoon} domains expiring in the next 30 days.</p>
        </div>

        <div className={`${styles.alertCard} ${styles.dangerAlert}`}>
          <div className={styles.alertHeader}>
            <Server size={20} />
            <h3>Hosting Renewals</h3>
            <span className={styles.badge}>{hostingRenewals}</span>
          </div>
          <p>You have {hostingRenewals} hostings expiring in the next 30 days.</p>
        </div>

        <div className={`${styles.alertCard} ${styles.dangerAlert}`}>
          <div className={styles.alertHeader}>
            <Package size={20} />
            <h3>Package Renewals</h3>
            <span className={styles.badge}>{packageRenewals}</span>
          </div>
          <p>You have {packageRenewals} packages expiring in the next 30 days.</p>
        </div>

        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <Calendar size={20} />
            <h3>Upcoming Meetings</h3>
            <span className={styles.badge}>{upcomingMeetings}</span>
          </div>
          <p>You have {upcomingMeetings} upcoming meetings starting today.</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className={styles.analyticsGrid}>
        <div className={styles.chartCard}>
          <h3>Revenue Forecast (Next 6 Months)</h3>
          <div className={styles.barChart}>
            {revenueData.map((data, idx) => (
              <div key={idx} className={styles.barCol}>
                <div 
                  className={styles.barFill} 
                  style={{ height: `${(data.amount / maxRev) * 100}%` }}
                  title={`₹${data.amount.toLocaleString()}`}
                ></div>
                <span className={styles.barLabel}>{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Project Status Overview</h3>
          <div className={styles.pipelineChart}>
            {projectStatusOverview.length > 0 ? projectStatusOverview.map((stage, idx) => (
              <div key={idx} className={styles.pipelineRow}>
                <span className={styles.pipelineLabel}>{stage.status}</span>
                <div className={styles.pipelineTrack}>
                  <div 
                    className={styles.pipelineFill} 
                    style={{ width: `${(stage.count / Math.max(...projectStatusOverview.map(s => s.count))) * 100}%` }}
                  ></div>
                </div>
                <span className={styles.pipelineValue}>{stage.count}</span>
              </div>
            )) : <p>No active projects.</p>}
          </div>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Activity Placeholder</h2>
        <div className={styles.emptyState}>
          <p>No recent activity to show.</p>
        </div>
      </div>
    </div>
  );
}
