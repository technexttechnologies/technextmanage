export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { Users, Target, Briefcase, RefreshCw, PhoneCall, CheckSquare } from "lucide-react";
import Link from "next/link";

export default async function Dashboard() {
  // Fetch real counts from DB
  const [
    totalCustomers,
    activeLeads,
    activeProjects,
    upcomingRenewals,
    todayFollowUps,
    pendingTasks
  ] = await Promise.all([
    prisma.customer.count({ where: { status: { not: "INACTIVE" } } }),
    prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "FOLLOW_UP"] } } }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.renewal.count({ 
      where: { 
        status: "ACTIVE", 
        expiryDate: { lte: new Date(new Date().setDate(new Date().getDate() + 30)) } // Next 30 days
      } 
    }),
    prisma.followUp.count({
      where: {
        status: "PENDING",
        date: {
          gte: new Date(new Date().setHours(0,0,0,0)),
          lt: new Date(new Date().setHours(23,59,59,999))
        }
      }
    }),
    prisma.task.count({ where: { status: "PENDING" } })
  ]);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" alt="TECHNEXT Logo" style={{ width: '140px', height: 'auto' }} />
        </div>
        <div>
          <h1 className={styles.greeting}>Welcome back, Admin 👋</h1>
          <p className={styles.subtitle}>Here is what's happening at Technext today.</p>
        </div>
      </header>

      {/* Main Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>
            <Users size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Total Customers</h3>
            <p className={styles.metricValue}>{totalCustomers}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.purple}`}>
            <Target size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Active Leads</h3>
            <p className={styles.metricValue}>{activeLeads}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Active Projects</h3>
            <p className={styles.metricValue}>{activeProjects}</p>
          </div>
        </div>
      </div>

      {/* Action required alerts */}
      <div className={styles.alertsGrid}>
        <div className={`${styles.alertCard} ${styles.warningAlert}`}>
          <div className={styles.alertHeader}>
            <PhoneCall size={20} />
            <h3>Today's Follow-ups</h3>
            <span className={styles.badge}>{todayFollowUps}</span>
          </div>
          <p>You have {todayFollowUps} follow-ups scheduled for today.</p>
          <Link href="/follow-ups" className="btn-primary" style={{marginTop: '12px'}}>View Follow-ups</Link>
        </div>

        <div className={`${styles.alertCard} ${styles.dangerAlert}`}>
          <div className={styles.alertHeader}>
            <RefreshCw size={20} />
            <h3>Upcoming Renewals</h3>
            <span className={styles.badge}>{upcomingRenewals}</span>
          </div>
          <p>You have {upcomingRenewals} services expiring in the next 30 days.</p>
          <Link href="/renewals" className="btn-primary" style={{marginTop: '12px'}}>View Renewals</Link>
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
