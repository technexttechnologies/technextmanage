"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Clock, Calendar, Users, CheckCircle2, AlertCircle, 
  Search, Plus, X, ArrowLeft, Filter, Building, UserCheck 
} from "lucide-react";
import styles from "../employees.module.css";
import { recordManualAttendance } from "../actions";

export default function StaffAttendanceClient({
  employees,
  attendances,
  selectedDateStr,
  departments,
  isAdminOrHR,
}: {
  employees: any[];
  attendances: any[];
  selectedDateStr: string;
  departments: any[];
  isAdminOrHR: boolean;
}) {
  const [targetDate, setTargetDate] = useState(selectedDateStr);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Map attendances by userId
  const attendanceMap: Record<string, any> = {};
  attendances.forEach((a) => {
    attendanceMap[a.userId] = a;
  });

  // Calculate statistics
  const totalEmployees = employees.length;
  const clockedInCount = attendances.length;
  const onTimeCount = attendances.filter(a => a.status === "PRESENT").length;
  const lateCount = attendances.filter(a => a.status === "LATE").length;
  const absentCount = Math.max(0, totalEmployees - clockedInCount);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === "ALL" || emp.departmentId === deptFilter;

    const record = attendanceMap[emp.id];
    const status = record ? record.status : "ABSENT";
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const calculateHours = (clockIn: string | Date, clockOut?: string | Date | null) => {
    if (!clockIn || !clockOut) return "In Progress";
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const diffMins = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>
            <Clock size={28} color="var(--brand-primary)" />
            Staff Attendance & Shift Records
          </h1>
          <p>Real-time company attendance roster, shift compliance, and working hours.</p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/employees/portal" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <UserCheck size={16} /> My Shift
          </Link>
          {isAdminOrHR && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setActionError(null);
                setIsManualModalOpen(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Manual Attendance Entry
            </button>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(99, 91, 255, 0.1)", color: "var(--brand-primary)" }}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalEmployees}</span>
            <span className={styles.statLabel}>Total Staff</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{onTimeCount}</span>
            <span className={styles.statLabel}>On-Time Present</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#D97706" }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{lateCount}</span>
            <span className={styles.statLabel}>Late Arrivals</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#DC2626" }}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{absentCount}</span>
            <span className={styles.statLabel}>Not Clocked In / Absent</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Date Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search employee by name, ID, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" }}>Date:</label>
          <input 
            type="date" 
            value={targetDate} 
            onChange={(e) => {
              setTargetDate(e.target.value);
              window.location.href = `/employees/attendance?date=${e.target.value}`;
            }}
            className={styles.filterSelect}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PRESENT">On Time (Present)</option>
          <option value="LATE">Late Arrival</option>
          <option value="HALF_DAY">Half-Day</option>
          <option value="ABSENT">Absent</option>
        </select>
      </div>

      {/* Attendance Roster Table */}
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--surface-border)", borderRadius: "16px", overflowX: "auto", boxShadow: "var(--shadow-sm)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-background)", borderBottom: "1px solid var(--surface-border)" }}>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Employee ID</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Employee Name</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Department</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Shift Hours</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Clock In</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Clock Out</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Total Hours</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No attendance records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const record = attendanceMap[emp.id];
                const status = record ? record.status : "ABSENT";

                return (
                  <tr key={emp.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <code>{emp.employeeId || "—"}</code>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "var(--text-primary)" }}>
                      {emp.name}
                      <div style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-muted)" }}>{emp.designation || emp.role}</div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>{emp.department?.name || "General"}</td>
                    <td style={{ padding: "14px 18px", fontSize: "13px" }}>{emp.shiftHours || "09:30 AM - 06:30 PM"}</td>
                    <td style={{ padding: "14px 18px", fontSize: "13px" }}>
                      {record?.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px" }}>
                      {record?.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: "600" }}>
                      {record?.clockIn ? calculateHours(record.clockIn, record.clockOut) : "—"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        background: 
                          status === "PRESENT" ? "#DCFCE7" : 
                          status === "LATE" ? "#FEF3C7" : 
                          status === "HALF_DAY" ? "#FED7AA" : "#FEE2E2",
                        color: 
                          status === "PRESENT" ? "#166534" : 
                          status === "LATE" ? "#92400E" : 
                          status === "HALF_DAY" ? "#9A3412" : "#991B1B",
                      }}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- MANUAL ENTRY MODAL --- */}
      {isManualModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsManualModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Clock size={20} color="var(--brand-primary)" />
                Record Manual Attendance
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsManualModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await recordManualAttendance(formData);
                  setIsManualModalOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to record attendance");
                }
              });
            }}>
              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Select Employee *</label>
                  <select name="userId" required defaultValue={employees[0]?.id}>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employeeId || e.email})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Attendance Date *</label>
                    <input type="date" name="date" required defaultValue={targetDate} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Status</label>
                    <select name="status" defaultValue="PRESENT">
                      <option value="PRESENT">Present (On Time)</option>
                      <option value="LATE">Late Arrival</option>
                      <option value="HALF_DAY">Half-Day</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Clock In Time</label>
                    <input type="time" name="clockInTime" defaultValue="09:30" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Clock Out Time (Optional)</label>
                    <input type="time" name="clockOutTime" defaultValue="18:30" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Shift Notes / Reason for Adjustment</label>
                  <input type="text" name="notes" placeholder="e.g. Approved remote work / Biometric sync correction" />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsManualModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Recording..." : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
