"use client";

import { useState, useTransition } from "react";
import { 
  UserCheck, Clock, CheckCircle2, AlertCircle, Calendar, 
  Briefcase, Plus, X, LogOut, Shield, Award, Building, Phone, Mail 
} from "lucide-react";
import styles from "./portal.module.css";
import { clockIn, clockOut, submitLeaveRequest } from "../actions";

export default function EmployeePortalClient({
  employee,
  todayAttendance,
  attendanceHistory,
  leaveHistory,
  assignedProjects,
}: {
  employee: any;
  todayAttendance: any;
  attendanceHistory: any[];
  leaveHistory: any[];
  assignedProjects: any[];
}) {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isClockedIn = !!todayAttendance;
  const isClockedOut = !!todayAttendance?.clockOut;

  const handleClockIn = () => {
    startTransition(async () => {
      try {
        await clockIn();
      } catch (err: any) {
        alert(err.message || "Failed to clock in");
      }
    });
  };

  const handleClockOut = () => {
    startTransition(async () => {
      try {
        await clockOut();
      } catch (err: any) {
        alert(err.message || "Failed to clock out");
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.empName}>{employee.name}</h1>
            <p className={styles.empTitle}>{employee.designation || employee.role.replace("_", " ")}</p>
            <div className={styles.metaPills}>
              {employee.employeeId && (
                <span className={styles.pill}>
                  <Award size={13} /> {employee.employeeId}
                </span>
              )}
              {employee.department && (
                <span className={styles.pill}>
                  <Building size={13} /> {employee.department.name}
                </span>
              )}
              <span className={styles.pill}>
                <Clock size={13} /> {employee.shiftHours || "09:30 AM - 06:30 PM"}
              </span>
              <span className={styles.pill}>
                <Shield size={13} /> {employee.role.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.logoWrapper}>
          <img 
            src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
            alt="TechNext Technologies" 
          />
        </div>
      </div>

      {/* Live Shift Widget */}
      <div className={styles.shiftCard}>
        <div className={styles.shiftInfo}>
          <div className={styles.shiftStatusTag}>
            {isClockedOut ? (
              <span style={{ color: "#059669", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={20} /> Shift Completed for Today
              </span>
            ) : isClockedIn ? (
              <span style={{ color: "#2563EB", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Clock size={20} /> Currently Working Shift (Clocked in at {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            ) : (
              <span style={{ color: "#64748B", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Clock size={20} /> Not Clocked In Yet
              </span>
            )}
          </div>
          <div className={styles.shiftTiming}>
            Scheduled Shift: <strong>{employee.shiftHours || "09:30 AM - 06:30 PM"}</strong> | Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className={styles.shiftActions}>
          {!isClockedIn && (
            <button 
              type="button" 
              className={styles.clockInBtn}
              onClick={handleClockIn}
              disabled={isPending}
            >
              <Clock size={18} /> {isPending ? "Clocking In..." : "Clock In Now"}
            </button>
          )}

          {isClockedIn && !isClockedOut && (
            <button 
              type="button" 
              className={styles.clockOutBtn}
              onClick={handleClockOut}
              disabled={isPending}
            >
              <LogOut size={18} /> {isPending ? "Clocking Out..." : "Clock Out Shift"}
            </button>
          )}

          {isClockedOut && (
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>
              Clocked Out at {new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className={styles.mainGrid}>
        {/* Left Column: Attendance History & Assigned Work */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Recent Attendance */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Clock size={18} />
                My Recent Attendance Log (Last 30 Days)
              </h2>
            </div>

            <div style={{ overflowX: "auto" }}>
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
                  {attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No attendance history found yet.
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((att: any) => (
                      <tr key={att.id}>
                        <td>{new Date(att.date).toLocaleDateString()}</td>
                        <td>{new Date(att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{att.clockOut ? new Date(att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                        <td>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: att.status === "PRESENT" ? "#DCFCE7" : att.status === "LATE" ? "#FEF3C7" : "#FEE2E2",
                            color: att.status === "PRESENT" ? "#166534" : att.status === "LATE" ? "#92400E" : "#991B1B",
                          }}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Assigned Projects */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Briefcase size={18} />
                My Active Projects & Tasks ({assignedProjects.length})
              </h2>
            </div>

            {assignedProjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                No active projects directly assigned to your profile.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {assignedProjects.map((p: any) => (
                  <div key={p.id} style={{ padding: "12px 14px", border: "1px solid var(--surface-border)", borderRadius: "8px", background: "var(--surface-background)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{p.name}</h4>
                      <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "999px", background: "#DBEAFE", color: "#1E40AF", fontWeight: "600" }}>
                        {p.status}
                      </span>
                    </div>
                    {p.customer && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Client: {p.customer.name} {p.customer.company && `(${p.customer.company})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Leave Balances & Requests */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Calendar size={18} />
                Leave Balances & Requests
              </h2>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => {
                  setLeaveError(null);
                  setIsLeaveModalOpen(true);
                }}
                style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={14} /> Request Leave
              </button>
            </div>

            {/* Leave Stat Boxes */}
            <div className={styles.leaveCardsGrid}>
              <div className={styles.leaveBox}>
                <div className={styles.leaveValue}>12</div>
                <div className={styles.leaveLabel}>Casual Leaves</div>
              </div>
              <div className={styles.leaveBox}>
                <div className={styles.leaveValue}>7</div>
                <div className={styles.leaveLabel}>Sick Leaves</div>
              </div>
              <div className={styles.leaveBox}>
                <div className={styles.leaveValue}>15</div>
                <div className={styles.leaveLabel}>Earned Leaves</div>
              </div>
            </div>

            {/* Leave Request History */}
            <div style={{ marginTop: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Recent Leave Applications</h3>
              {leaveHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No leave requests submitted.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {leaveHistory.map((lr: any) => (
                    <div key={lr.id} style={{ padding: "10px", border: "1px solid var(--surface-border)", borderRadius: "8px", background: "var(--surface-background)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "700", fontSize: "13px" }}>{lr.type} Leave</span>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: lr.status === "APPROVED" ? "#DCFCE7" : lr.status === "REJECTED" ? "#FEE2E2" : "#FEF3C7",
                          color: lr.status === "APPROVED" ? "#166534" : lr.status === "REJECTED" ? "#991B1B" : "#92400E",
                        }}>
                          {lr.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(lr.startDate).toLocaleDateString()} - {new Date(lr.endDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Reason: {lr.reason}
                      </div>
                      {lr.adminNotes && (
                        <div style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic", marginTop: "2px" }}>
                          HR Note: "{lr.adminNotes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* --- APPLY LEAVE MODAL --- */}
      {isLeaveModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsLeaveModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} color="var(--brand-primary)" />
                Submit Leave Application
              </h2>
              <button type="button" onClick={() => setIsLeaveModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form action={async (formData) => {
              setLeaveError(null);
              startTransition(async () => {
                try {
                  await submitLeaveRequest(formData);
                  setIsLeaveModalOpen(false);
                } catch (err: any) {
                  setLeaveError(err.message || "Failed to submit leave application");
                }
              });
            }}>
              <div className={styles.modalBody}>
                {leaveError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {leaveError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Leave Type *</label>
                  <select name="type" required defaultValue="CASUAL" style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--surface-border)", background: "var(--surface-background)" }}>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Start Date *</label>
                    <input type="date" name="startDate" required defaultValue={new Date().toISOString().split("T")[0]} style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--surface-border)", background: "var(--surface-background)" }} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600" }}>End Date *</label>
                    <input type="date" name="endDate" required defaultValue={new Date().toISOString().split("T")[0]} style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--surface-border)", background: "var(--surface-background)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Reason for Leave *</label>
                  <textarea name="reason" rows={3} required placeholder="Explain your reason for taking leave..." style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--surface-border)", background: "var(--surface-background)" }}></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsLeaveModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
