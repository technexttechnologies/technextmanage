"use client";

import { useState, useTransition } from "react";
import { 
  FileCheck, Plus, Search, Calendar, Clock, 
  Award, ExternalLink, CheckCircle2, User, X, MessageSquare 
} from "lucide-react";
import styles from "../faculty-shared.module.css";
import { createAssignment, gradeSubmission } from "../actions";

export default function AssignmentsClient({
  assignments,
  batches,
}: {
  assignments: any[];
  batches: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");

  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [reviewingAssignment, setReviewingAssignment] = useState<any | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAssignments = assignments.filter((asgn) => {
    const matchesSearch = 
      asgn.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asgn.batch.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === "ALL" || asgn.batchId === batchFilter;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            <FileCheck size={24} color="var(--brand-primary)" />
            Assignments & Project Evaluations
          </h1>
          <p className={styles.headerSubtitle}>
            Publish coursework, review student project repositories, and assign grades with feedback.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsAddAssignmentOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Create Assignment
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search assignments or batch names..." 
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

      {/* Grid of Assignments */}
      <div className={styles.grid}>
        {filteredAssignments.length === 0 ? (
          <div className={styles.emptyState}>
            <FileCheck size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No assignments created yet</h3>
            <p>Click "Create Assignment" to publish your first task.</p>
          </div>
        ) : (
          filteredAssignments.map((asgn) => {
            const isDuePassed = new Date(asgn.dueDate) < new Date();
            const totalSubmissions = asgn.submissions?.length || 0;
            const gradedCount = asgn.submissions?.filter((s: any) => s.status === "GRADED").length || 0;

            return (
              <div key={asgn.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.cardTitle}>{asgn.title}</h3>
                    <p className={styles.cardSubtitle}>{asgn.batch.name}</p>
                  </div>
                  <span className={`${styles.badge} ${isDuePassed ? styles.badgeCompleted : styles.badgeUpcoming}`}>
                    {isDuePassed ? "Closed" : "Active"}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineClamp: 2 }}>
                  {asgn.description}
                </p>

                <div className={styles.cardMetaList}>
                  <div className={styles.metaRow}>
                    <Calendar size={15} />
                    <span>Due Date: <strong>{new Date(asgn.dueDate).toLocaleDateString()}</strong></span>
                  </div>
                  <div className={styles.metaRow}>
                    <Award size={15} />
                    <span>Maximum Marks: <strong>{asgn.maxMarks} pts</strong></span>
                  </div>
                  <div className={styles.metaRow}>
                    <CheckCircle2 size={15} />
                    <span>Submissions: <strong>{totalSubmissions}</strong> ({gradedCount} Graded)</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  {asgn.attachmentUrl ? (
                    <a 
                      href={asgn.attachmentUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ fontSize: "12px", color: "var(--brand-accent)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      Resource Link <ExternalLink size={12} />
                    </a>
                  ) : <span />}

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setActionError(null);
                      setReviewingAssignment(asgn);
                    }}
                    style={{ padding: "6px 14px", fontSize: "12px" }}
                  >
                    View Submissions ({totalSubmissions})
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- CREATE ASSIGNMENT MODAL --- */}
      {isAddAssignmentOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddAssignmentOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FileCheck size={20} color="var(--brand-primary)" />
                Create New Assignment
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddAssignmentOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createAssignment(formData);
                  setIsAddAssignmentOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to create assignment");
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
                  <label>Assignment Title *</label>
                  <input type="text" name="title" required placeholder="e.g. Design & Build Next.js Dashboard" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Target Batch *</label>
                    <select name="batchId" required defaultValue={batches[0]?.id}>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Max Marks</label>
                    <input type="number" name="maxMarks" defaultValue="100" min="10" max="1000" />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Submission Due Date *</label>
                    <input 
                      type="date" 
                      name="dueDate" 
                      required 
                      defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} 
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Resource / Starter URL</label>
                    <input type="url" name="attachmentUrl" placeholder="https://github.com/..." />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Instructions & Requirements *</label>
                  <textarea name="description" rows={4} required placeholder="Detail the submission requirements, evaluation criteria, and milestones..."></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddAssignmentOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Publishing..." : "Publish Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REVIEW SUBMISSIONS MODAL --- */}
      {reviewingAssignment && (
        <div className={styles.modalOverlay} onClick={() => setReviewingAssignment(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Submissions: {reviewingAssignment.title}</h2>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{reviewingAssignment.batch.name}</span>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setReviewingAssignment(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {reviewingAssignment.submissions?.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  <p>No student has submitted work for this assignment yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {reviewingAssignment.submissions.map((sub: any) => (
                    <div key={sub.id} style={{ border: "1px solid var(--surface-border)", borderRadius: "8px", padding: "14px", background: "var(--surface-background)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{sub.student?.name} ({sub.student?.rollNo})</div>
                        <span className={`${styles.badge} ${sub.status === "GRADED" ? styles.badgeOngoing : styles.badgeUpcoming}`}>
                          {sub.status}
                        </span>
                      </div>

                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                        Submitted on: {new Date(sub.submissionDate).toLocaleDateString()}
                        {sub.marksObtained !== null && (
                          <span style={{ marginLeft: "12px", fontWeight: "700", color: "var(--brand-primary)" }}>
                            Grade: {sub.marksObtained} / {reviewingAssignment.maxMarks}
                          </span>
                        )}
                      </div>

                      {sub.content && (
                        <div style={{ background: "var(--surface-card)", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", border: "1px solid var(--surface-border)" }}>
                          {sub.content}
                        </div>
                      )}

                      {sub.feedback && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "8px" }}>
                          Feedback: "{sub.feedback}"
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        {sub.fileUrl && (
                          <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                            View Repo/File ↗
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setGradingSubmission(sub)}
                          style={{ fontSize: "12px", padding: "4px 10px" }}
                        >
                          {sub.status === "GRADED" ? "Edit Grade" : "Evaluate & Grade"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className="btn-secondary" onClick={() => setReviewingAssignment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GRADE SUBMISSION MODAL --- */}
      {gradingSubmission && (
        <div className={styles.modalOverlay} onClick={() => setGradingSubmission(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className={styles.modalHeader}>
              <h2>Grade Submission: {gradingSubmission.student?.name}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setGradingSubmission(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await gradeSubmission(formData);
                  setGradingSubmission(null);
                  setReviewingAssignment(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to grade submission");
                }
              });
            }}>
              <input type="hidden" name="submissionId" value={gradingSubmission.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Marks Awarded (out of {reviewingAssignment?.maxMarks || 100}) *</label>
                  <input 
                    type="number" 
                    name="marksObtained" 
                    required 
                    min="0" 
                    max={reviewingAssignment?.maxMarks || 100}
                    defaultValue={gradingSubmission.marksObtained || ""} 
                    placeholder="e.g. 85" 
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Status</label>
                  <select name="status" defaultValue="GRADED">
                    <option value="GRADED">Graded & Approved</option>
                    <option value="RESUBMIT">Request Revision / Resubmit</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Instructor Feedback / Comments</label>
                  <textarea 
                    name="feedback" 
                    rows={3} 
                    defaultValue={gradingSubmission.feedback || ""}
                    placeholder="Provide constructive feedback, code review remarks, or notes..."
                  ></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setGradingSubmission(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
