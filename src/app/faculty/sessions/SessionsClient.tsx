"use client";

import { useState, useTransition } from "react";
import { Clock, Plus, Search, Calendar, Users, X, BookOpen, CheckCircle2 } from "lucide-react";
import styles from "../faculty-shared.module.css";
import { logFacultySession } from "../actions";

export default function SessionsClient({
  sessions,
  batches,
}: {
  sessions: any[];
  batches: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = 
      s.topicCovered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.batch.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === "ALL" || s.batchId === batchFilter;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            <Clock size={24} color="var(--brand-primary)" />
            Class Lecture Logs & Syllabus Progress
          </h1>
          <p className={styles.headerSubtitle}>
            Record daily classroom topics, track lecture durations, and maintain training audit logs.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsAddSessionOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Log New Session
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search topics covered or session summaries..." 
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
      </div>

      {/* Table of Sessions */}
      <div className={styles.tableContainer}>
        {filteredSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No lecture sessions recorded</h3>
            <p>Click "Log New Session" to log today's classroom lecture.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "130px" }}>Session Date</th>
                <th>Topic Covered</th>
                <th>Batch / Course</th>
                <th>Instructor</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((ses) => (
                <tr key={ses.id}>
                  <td>
                    <strong>{new Date(ses.sessionDate).toLocaleDateString()}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{ses.topicCovered}</div>
                    {ses.summary && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {ses.summary}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{ses.batch?.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{ses.batch?.course?.title}</div>
                  </td>
                  <td>{ses.faculty?.name || "Assigned Trainer"}</td>
                  <td>{ses.durationMinutes} mins</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeOngoing}`}>
                      {ses.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- LOG SESSION MODAL --- */}
      {isAddSessionOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddSessionOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Clock size={20} color="var(--brand-primary)" />
                Log Classroom Lecture Session
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddSessionOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await logFacultySession(formData);
                  setIsAddSessionOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to log session");
                }
              });
            }}>
              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Training Batch *</label>
                    <select name="batchId" required defaultValue={batches[0]?.id}>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Session Date *</label>
                    <input 
                      type="date" 
                      name="sessionDate" 
                      required 
                      defaultValue={new Date().toISOString().split("T")[0]} 
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Topic Covered *</label>
                  <input 
                    type="text" 
                    name="topicCovered" 
                    required 
                    placeholder="e.g. Next.js Server Components, Server Actions & Turbopack" 
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Duration (Minutes)</label>
                  <input type="number" name="durationMinutes" defaultValue="60" min="15" max="480" />
                </div>

                <div className={styles.inputGroup}>
                  <label>Summary / Syllabus Notes</label>
                  <textarea 
                    name="summary" 
                    rows={3} 
                    placeholder="Key concepts discussed, questions answered, homework assigned..."
                  ></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddSessionOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Logging..." : "Save Lecture Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
