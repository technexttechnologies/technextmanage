"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  GraduationCap, Users, CalendarCheck, FileCheck, Clock, 
  BookOpen, Plus, ArrowLeft, Phone, Mail, CheckCircle2, 
  XCircle, MapPin, Calendar, ExternalLink
} from "lucide-react";
import styles from "../../faculty-shared.module.css";
import { createStudent } from "../../actions";

export default function BatchDetailsClient({ batch }: { batch: any }) {
  const [activeTab, setActiveTab] = useState<"students" | "attendance" | "sessions" | "assignments" | "materials">("students");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const students = batch.students || [];
  const attendances = batch.attendances || [];
  const sessions = batch.sessions || [];
  const assignments = batch.assignments || [];
  const materials = batch.materials || [];

  return (
    <div className={styles.pageWrapper}>
      {/* Back button & Batch Title */}
      <div className={styles.pageHeader}>
        <div>
          <Link 
            href="/faculty/batches" 
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--brand-accent)", textDecoration: "none", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}
          >
            <ArrowLeft size={16} /> Back to Batches
          </Link>
          <h1 className={styles.headerTitle}>
            <GraduationCap size={24} color="var(--brand-primary)" />
            {batch.name}
          </h1>
          <p className={styles.headerSubtitle}>
            Course: <strong>{batch.course.title}</strong> | Batch Code: <code>{batch.batchCode}</code> | Mode: <strong>{batch.mode}</strong>
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link 
            href={`/faculty/attendance?batchId=${batch.id}`} 
            className="btn-primary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <CalendarCheck size={16} /> Mark Today's Attendance
          </Link>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => setIsAddStudentOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* Internal Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--surface-border)", overflowX: "auto" }}>
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "students" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            color: activeTab === "students" ? "var(--brand-primary)" : "var(--text-muted)",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Users size={16} /> Students ({students.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "attendance" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            color: activeTab === "attendance" ? "var(--brand-primary)" : "var(--text-muted)",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <CalendarCheck size={16} /> Attendance Records
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "sessions" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            color: activeTab === "sessions" ? "var(--brand-primary)" : "var(--text-muted)",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Clock size={16} /> Lecture Logs ({sessions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("assignments")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "assignments" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            color: activeTab === "assignments" ? "var(--brand-primary)" : "var(--text-muted)",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <FileCheck size={16} /> Assignments ({assignments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "materials" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            color: activeTab === "materials" ? "var(--brand-primary)" : "var(--text-muted)",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <BookOpen size={16} /> Study Materials ({materials.length})
        </button>
      </div>

      {/* --- TAB 1: STUDENTS --- */}
      {activeTab === "students" && (
        <div className={styles.tableContainer}>
          {students.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3>No students enrolled in this batch yet</h3>
              <p>Click "Add Student" above to enroll your first student.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Email Address</th>
                  <th>Contact Phone</th>
                  <th>Status</th>
                  <th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st: any) => (
                  <tr key={st.id}>
                    <td><code>{st.rollNo}</code></td>
                    <td style={{ fontWeight: "700" }}>{st.name}</td>
                    <td>{st.email}</td>
                    <td>{st.phone}</td>
                    <td>
                      <span className={`${styles.badge} ${st.status === "ACTIVE" ? styles.badgeOngoing : styles.badgeCompleted}`}>
                        {st.status}
                      </span>
                    </td>
                    <td>{new Date(st.admissionDate || st.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- TAB 2: ATTENDANCE HISTORY --- */}
      {activeTab === "attendance" && (
        <div className={styles.tableContainer}>
          {attendances.length === 0 ? (
            <div className={styles.emptyState}>
              <CalendarCheck size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3>No attendance records taken yet</h3>
              <p>Click "Mark Today's Attendance" to take attendance for this batch.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Roll No</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((att: any) => (
                  <tr key={att.id}>
                    <td>{new Date(att.date).toLocaleDateString()}</td>
                    <td><code>{att.student?.rollNo}</code></td>
                    <td style={{ fontWeight: "600" }}>{att.student?.name}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        att.status === "PRESENT" 
                          ? styles.badgeOngoing 
                          : att.status === "LATE" 
                          ? styles.badgeUpcoming 
                          : styles.badgeCompleted
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td>{att.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- TAB 3: LECTURE SESSIONS --- */}
      {activeTab === "sessions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3>No lecture sessions recorded yet</h3>
              <p>Record daily syllabus progress in the Class Logs tab.</p>
            </div>
          ) : (
            sessions.map((ses: any) => (
              <div key={ses.id} className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{ses.topicCovered}</h3>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{new Date(ses.sessionDate).toLocaleDateString()}</span>
                </div>
                {ses.summary && (
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>{ses.summary}</p>
                )}
                <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px" }}>
                  <span>Duration: {ses.durationMinutes} mins</span>
                  <span>Status: {ses.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB 4: ASSIGNMENTS --- */}
      {activeTab === "assignments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {assignments.length === 0 ? (
            <div className={styles.emptyState}>
              <FileCheck size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3>No assignments created yet for this batch</h3>
            </div>
          ) : (
            assignments.map((asgn: any) => (
              <div key={asgn.id} className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{asgn.title}</h3>
                  <span style={{ fontSize: "13px", color: "#DC2626", fontWeight: "600" }}>
                    Due: {new Date(asgn.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>{asgn.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                  <span>Max Marks: {asgn.maxMarks}</span>
                  {asgn.attachmentUrl && (
                    <a href={asgn.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--brand-accent)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      Attachment Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB 5: STUDY MATERIALS --- */}
      {activeTab === "materials" && (
        <div className={styles.grid}>
          {materials.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3>No study materials shared yet</h3>
            </div>
          ) : (
            materials.map((mat: any) => (
              <div key={mat.id} className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{mat.title}</h4>
                  <span className={`${styles.badge} ${styles.badgeUpcoming}`}>{mat.category}</span>
                </div>
                {mat.description && <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{mat.description}</p>}
                <a 
                  href={mat.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", justifyContent: "center" }}
                >
                  Open Resource <ExternalLink size={12} />
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- ADD STUDENT MODAL --- */}
      {isAddStudentOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddStudentOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Users size={20} color="var(--brand-primary)" />
                Enroll Student into {batch.name}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddStudentOpen(false)}>
                ✕
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              try {
                await createStudent(formData);
                setIsAddStudentOpen(false);
              } catch (err: any) {
                setActionError(err.message || "Failed to add student");
              }
            }}>
              <input type="hidden" name="batchId" value={batch.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Student Full Name *</label>
                  <input type="text" name="name" required placeholder="e.g. John Doe" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Roll Number *</label>
                    <input type="text" name="rollNo" required placeholder="e.g. TN-2026-099" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone Number *</label>
                    <input type="tel" name="phone" required placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Email Address *</label>
                  <input type="email" name="email" required placeholder="student@example.com" />
                </div>

                <div className={styles.inputGroup}>
                  <label>Notes / Academic Background</label>
                  <textarea name="notes" rows={2} placeholder="Optional notes..."></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddStudentOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
