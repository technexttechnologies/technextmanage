export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { clockIn, clockOut } from "./actions";
import { Clock, CheckCircle, LogOut } from "lucide-react";
import styles from "./page.module.css";
import { format } from "date-fns";

export default async function AttendancePage() {
  const session = await getSession();
  if (!session?.userId) {
    return <div>Unauthorized</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId as string,
        date: today
      }
    }
  });

  const history = await prisma.attendance.findMany({
    where: {
      userId: session.userId as string
    },
    orderBy: {
      date: 'desc'
    },
    take: 30
  });

  const isClockedIn = !!todayRecord;
  const isClockedOut = !!todayRecord?.clockOut;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance</h1>
          <p className={styles.subtitle}>Track your daily attendance.</p>
        </div>
      </header>

      <div className={styles.statusCard}>
        <div className={styles.statusText}>
          {isClockedOut ? (
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} /> You have completed your shift for today.
            </span>
          ) : isClockedIn ? (
            <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} /> You are currently clocked in.
            </span>
          ) : (
            <span style={{ color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} /> You are not clocked in yet.
            </span>
          )}
        </div>

        {!isClockedIn && (
          <form action={clockIn}>
            <button type="submit" className={`${styles.actionBtn} ${styles.clockInBtn}`}>
              <Clock size={20} /> Clock In
            </button>
          </form>
        )}

        {isClockedIn && !isClockedOut && (
          <form action={clockOut}>
            <button type="submit" className={`${styles.actionBtn} ${styles.clockOutBtn}`}>
              <LogOut size={20} /> Clock Out
            </button>
          </form>
        )}
      </div>

      <div className={styles.historySection}>
        <h2 className={styles.historyTitle}>Attendance History (Last 30 Days)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                history.map(record => (
                  <tr key={record.id}>
                    <td>{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                    <td>{format(new Date(record.clockIn), 'hh:mm a')}</td>
                    <td>{record.clockOut ? format(new Date(record.clockOut), 'hh:mm a') : '-'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${record.status}`] || ''}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
