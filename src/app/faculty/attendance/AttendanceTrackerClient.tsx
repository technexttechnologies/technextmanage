"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  CalendarCheck, Check, X, Clock, AlertCircle, 
  CheckCircle2, Users, Save, Sparkles, Filter 
} from "lucide-react";
import styles from "../faculty-shared.module.css";
import { saveBatchAttendance } from "../actions";

export default function AttendanceTrackerClient({
  batches,
  initialBatchId,
  initialDate,
  existingAttendances,
}: {
  batches: any[];
  initialBatchId: string;
  initialDate: string;
  existingAttendances: any[];
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId || (batches[0]?.id || ""));
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
  const students = selectedBatch?.students || [];

  // Attendance status mapping for each student: studentId -> "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Populate with existing attendance if available for this date, otherwise default to "PRESENT"
    const map: Record<string, string> = {};
    students.forEach((st: any) => {
      const match = existingAttendances.find(
        (a: any) => a.studentId === st.id && a.date.toString().startsWith(selectedDate)
      );
      map[st.id] = match ? match.status : "PRESENT";
    });
    setAttendanceMap(map);
    setSaveSuccess(false);
  }, [selectedBatchId, selectedDate, existingAttendances]);

  const setStudentStatus = (studentId: string, status: string) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    setSaveSuccess(false);
  };

  const markAll = (status: string) => {
    const map: Record<string, string> = {};
    students.forEach((st: any) => {
      map[st.id] = status;
    });
    setAttendanceMap(map);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    const records = students.map((st: any) => ({
      studentId: st.id,
      status: attendanceMap[st.id] || "PRESENT",
    }));

    startTransition(async () => {
      try {
        await saveBatchAttendance(selectedBatchId, selectedDate, records);
        setSaveSuccess(true);
      } catch (err: any) {
        setSaveError(err.message || "Failed to save attendance.");
      }
    });
  };

  // Stats
  const total = students.length;
  const presentCount = Object.values(attendanceMap).filter(s => s === "PRESENT").length;
  const absentCount = Object.values(attendanceMap).filter(s => s === "ABSENT").length;
  const lateCount = Object.values(attendanceMap).filter(s => s === "LATE").length;
  const excusedCount = Object.values(attendanceMap).filter(s => s === "EXCUSED").length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            <CalendarCheck size={24} color="var(--brand-primary)" />
            Student Attendance Tracker
          </h1>
          <p className={styles.headerSubtitle}>
            Mark daily class attendance, track absences, and record academic participation.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={isPending || students.length === 0}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", minWidth: "160px", justifyContent: "center" }}
          >
            <Save size={16} />
            <span>{isPending ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className={styles.toolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" }}>Select Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className={styles.filterSelect}
            style={{ width: "100%" }}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.batchCode}) - {b.course.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "200px" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" }}>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.filterSelect}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => markAll("PRESENT")}
            style={{ fontSize: "12px", padding: "8px 12px" }}
          >
            ✓ Mark All Present
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => markAll("ABSENT")}
            style={{ fontSize: "12px", padding: "8px 12px" }}
          >
            ✕ Mark All Absent
          </button>
        </div>
      </div>

      {/* Live Stats Pill Banner */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--surface-border)", padding: "10px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <Users size={16} color="var(--brand-primary)" />
          <span>Total: <strong>{total}</strong></span>
        </div>

        <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", color: "#166534", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "600" }}>
          ✓ Present: {presentCount}
        </div>

        <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#991B1B", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "600" }}>
          ✕ Absent: {absentCount}
        </div>

        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "600" }}>
          ⏱️ Late: {lateCount}
        </div>

        <div style={{ background: "#DBEAFE", border: "1px solid #BFDBFE", color: "#1E40AF", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "600" }}>
          Rates: {attendanceRate}% Attendance
        </div>

        {saveSuccess && (
          <div style={{ background: "#DCFCE7", color: "#15803D", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={16} /> Saved Successfully!
          </div>
        )}

        {saveError && (
          <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>
            {saveError}
          </div>
        )}
      </div>

      {/* Students Attendance Table */}
      <div className={styles.tableContainer}>
        {students.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No students found in this batch</h3>
            <p>Enroll students into this batch to begin taking attendance.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Roll No</th>
                <th>Student Name</th>
                <th>Contact Info</th>
                <th style={{ textAlign: "center", width: "340px" }}>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st: any) => {
                const currentStatus = attendanceMap[st.id] || "PRESENT";

                return (
                  <tr key={st.id}>
                    <td><code>{st.rollNo}</code></td>
                    <td style={{ fontWeight: "700" }}>{st.name}</td>
                    <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {st.phone} | {st.email}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(st.id, "PRESENT")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: currentStatus === "PRESENT" ? "#16A34A" : "var(--surface-background)",
                            borderColor: currentStatus === "PRESENT" ? "#16A34A" : "var(--surface-border)",
                            color: currentStatus === "PRESENT" ? "white" : "var(--text-secondary)",
                          }}
                        >
                          ✓ Present
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(st.id, "ABSENT")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: currentStatus === "ABSENT" ? "#DC2626" : "var(--surface-background)",
                            borderColor: currentStatus === "ABSENT" ? "#DC2626" : "var(--surface-border)",
                            color: currentStatus === "ABSENT" ? "white" : "var(--text-secondary)",
                          }}
                        >
                          ✕ Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(st.id, "LATE")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: currentStatus === "LATE" ? "#D97706" : "var(--surface-background)",
                            borderColor: currentStatus === "LATE" ? "#D97706" : "var(--surface-border)",
                            color: currentStatus === "LATE" ? "white" : "var(--text-secondary)",
                          }}
                        >
                          ⏱️ Late
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(st.id, "EXCUSED")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: currentStatus === "EXCUSED" ? "#2563EB" : "var(--surface-background)",
                            borderColor: currentStatus === "EXCUSED" ? "#2563EB" : "var(--surface-border)",
                            color: currentStatus === "EXCUSED" ? "white" : "var(--text-secondary)",
                          }}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
