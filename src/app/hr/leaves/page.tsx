export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requestLeave } from "./actions";
import { format } from "date-fns";
import styles from "./page.module.css";

export default async function LeavesPage() {
  const session = await getSession();
  if (!session?.userId) {
    return <div>Unauthorized</div>;
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      userId: session.userId as string
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Leave Management</h1>
        <p className={styles.subtitle}>Request leaves and view your history.</p>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Request Leave</h2>
          <form action={requestLeave}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Leave Type</label>
              <select name="type" id="type" className={styles.input} required>
                <option value="">Select Type</option>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="EARNED">Earned Leave</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input type="date" name="startDate" id="startDate" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endDate">End Date</label>
              <input type="date" name="endDate" id="endDate" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="reason">Reason</label>
              <textarea name="reason" id="reason" className={styles.textarea} required placeholder="Brief reason for leave..."></textarea>
            </div>
            <button type="submit" className={styles.submitBtn}>Submit Request</button>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>My Leave Requests</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  leaves.map(leave => (
                    <tr key={leave.id}>
                      <td>{leave.type}</td>
                      <td>
                        {format(new Date(leave.startDate), 'MMM dd, yyyy')} - 
                        {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${leave.status}`] || ''}`}>
                          {leave.status}
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
    </div>
  );
}
