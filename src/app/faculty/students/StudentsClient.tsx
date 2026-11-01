"use client";

import { useState, useTransition } from "react";
import { 
  Users, UserPlus, Search, Phone, Mail, GraduationCap, 
  Trash2, Edit, X, CheckCircle2 
} from "lucide-react";
import styles from "../faculty-shared.module.css";
import { createStudent, deleteStudent } from "../actions";

export default function StudentsClient({
  students,
  batches,
}: {
  students: any[];
  batches: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredStudents = students.filter((st) => {
    const matchesSearch = 
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.phone.includes(searchTerm);

    const matchesBatch = batchFilter === "ALL" || st.batchId === batchFilter;
    const matchesStatus = statusFilter === "ALL" || st.status === statusFilter;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  const handleDelete = (studentId: string, name: string) => {
    if (confirm(`Are you sure you want to delete student ${name}?`)) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("studentId", studentId);
        try {
          await deleteStudent(formData);
        } catch (err: any) {
          alert(err.message || "Failed to delete student");
        }
      });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            <Users size={24} color="var(--brand-primary)" />
            Student Directory & Enrolment
          </h1>
          <p className={styles.headerSubtitle}>
            Browse student records, manage batch allocations, and enroll new candidates.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsAddStudentOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <UserPlus size={16} /> Enroll New Student
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by student name, roll number, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="ALL">All Batches ({batches.length})</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Students</option>
          <option value="COMPLETED">Graduated / Completed</option>
          <option value="DROPPED">Discontinued</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No student records found</h3>
            <p>Try refining your search terms or enroll a new student.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "130px" }}>Roll No</th>
                <th>Student Name</th>
                <th>Batch / Course</th>
                <th>Contact Details</th>
                <th>Status</th>
                <th>Enrolled Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => (
                <tr key={st.id}>
                  <td><code>{st.rollNo}</code></td>
                  <td style={{ fontWeight: "700" }}>{st.name}</td>
                  <td>
                    <div style={{ fontWeight: "600", color: "var(--brand-primary)" }}>{st.batch?.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{st.batch?.course?.title}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "13px" }}>
                      <span><Mail size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {st.email}</span>
                      <span><Phone size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {st.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      st.status === "ACTIVE" 
                        ? styles.badgeOngoing 
                        : st.status === "COMPLETED" 
                        ? styles.badgeUpcoming 
                        : styles.badgeCompleted
                    }`}>
                      {st.status}
                    </span>
                  </td>
                  <td>{new Date(st.admissionDate || st.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(st.id, st.name)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        padding: "6px",
                      }}
                      title="Delete Student"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ENROLL STUDENT MODAL --- */}
      {isAddStudentOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddStudentOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <UserPlus size={20} color="var(--brand-primary)" />
                Enroll New Student Candidate
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddStudentOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createStudent(formData);
                  setIsAddStudentOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to enroll student");
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
                  <label>Full Student Name *</label>
                  <input type="text" name="name" required placeholder="e.g. Adarsh Nair" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Roll Number *</label>
                    <input type="text" name="rollNo" required placeholder="e.g. TN-2026-025" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Assigned Batch *</label>
                    <select name="batchId" required defaultValue={batches[0]?.id}>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Phone Number *</label>
                    <input type="tel" name="phone" required placeholder="+91 98765 43210" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Email Address *</label>
                    <input type="email" name="email" required placeholder="candidate@gmail.com" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Academic Notes / Background</label>
                  <textarea name="notes" rows={2} placeholder="Degree, programming experience, expectations..."></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddStudentOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
