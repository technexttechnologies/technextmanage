"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  CalendarCheck, Plus, Search, CheckCircle2, XCircle, 
  Clock, AlertCircle, User, Filter, Building, X, MessageSquare 
} from "lucide-react";
import styles from "../employees.module.css";
import { submitLeaveRequest, reviewLeaveRequest } from "../actions";

export default function LeaveManagementClient({
  leaves,
  currentUserId,
  isAdminOrHR,
}: {
  leaves: any[];
  currentUserId: string;
  isAdminOrHR: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalLeaves = leaves.length;
  const pendingCount = leaves.filter(l => l.status === "PENDING").length;
  const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;

  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch =
      l.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user.employeeId && l.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
    const matchesType = typeFilter === "ALL" || l.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleReviewSubmit = () => {
    if (!reviewingLeave) return;
    setActionError(null);

    startTransition(async () => {
      try {
        await reviewLeaveRequest(reviewingLeave.id, reviewStatus, reviewNotes);
        setReviewingLeave(null);
        setReviewNotes("");
      } catch (err: any) {
        setActionError(err.message || "Failed to update leave status");
      }
    });
  };

  const calculateDays = (start: string | Date, end: string | Date) => {
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? "1 day" : `${days} days`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>
            <CalendarCheck size={28} color="var(--brand-primary)" />
            Employee Leave Management & Approvals
          </h1>
          <p>Review leave applications, manage employee time-off, and track leave balances.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsApplyModalOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Apply for Leave
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(99, 91, 255, 0.1)", color: "var(--brand-primary)" }}>
            <CalendarCheck size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalLeaves}</span>
            <span className={styles.statLabel}>Total Applications</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#D97706" }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{pendingCount}</span>
            <span className={styles.statLabel}>Pending HR Review</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{approvedCount}</span>
            <span className={styles.statLabel}>Approved Leaves</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#DC2626" }}>
            <XCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{rejectedCount}</span>
            <span className={styles.statLabel}>Rejected Requests</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by applicant name, ID, or reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses ({leaves.length})</option>
          <option value="PENDING">Pending Review ({pendingCount})</option>
          <option value="APPROVED">Approved ({approvedCount})</option>
          <option value="REJECTED">Rejected ({rejectedCount})</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Leave Types</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="EARNED">Earned Leave</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--surface-border)", borderRadius: "16px", overflowX: "auto", boxShadow: "var(--shadow-sm)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-background)", borderBottom: "1px solid var(--surface-border)" }}>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Employee</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Leave Type</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Duration & Dates</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Reason</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Status</th>
              <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No leave applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredLeaves.map((leave) => (
                <tr key={leave.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{leave.user.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {leave.user.employeeId || leave.user.email} {leave.user.department && `• ${leave.user.department.name}`}
                    </div>
                  </td>

                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontWeight: "600", fontSize: "13px" }}>{leave.type} Leave</span>
                  </td>

                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: "600", fontSize: "13px" }}>
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {calculateDays(leave.startDate, leave.endDate)}
                    </div>
                  </td>

                  <td style={{ padding: "14px 18px", maxWidth: "260px" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{leave.reason}</div>
                    {leave.adminNotes && (
                      <div style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic", marginTop: "2px" }}>
                        Note: "{leave.adminNotes}"
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "14px 18px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      background: 
                        leave.status === "APPROVED" ? "#DCFCE7" : 
                        leave.status === "REJECTED" ? "#FEE2E2" : "#FEF3C7",
                      color: 
                        leave.status === "APPROVED" ? "#166534" : 
                        leave.status === "REJECTED" ? "#991B1B" : "#92400E",
                    }}>
                      {leave.status}
                    </span>
                  </td>

                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    {isAdminOrHR && leave.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingLeave(leave);
                            setReviewStatus("APPROVED");
                            setReviewNotes("");
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#16A34A",
                            color: "white",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReviewingLeave(leave);
                            setReviewStatus("REJECTED");
                            setReviewNotes("");
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#DC2626",
                            color: "white",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {leave.reviewedBy ? `By ${leave.reviewedBy.name}` : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- REVIEW MODAL --- */}
      {reviewingLeave && (
        <div className={styles.modalOverlay} onClick={() => setReviewingLeave(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className={styles.modalHeader}>
              <h2>
                {reviewStatus === "APPROVED" ? <CheckCircle2 size={20} color="#16A34A" /> : <XCircle size={20} color="#DC2626" />}
                {reviewStatus === "APPROVED" ? "Approve Leave Application" : "Reject Leave Application"}
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setReviewingLeave(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                Applicant: <strong>{reviewingLeave.user.name}</strong> ({reviewingLeave.type} Leave)
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                Dates: {new Date(reviewingLeave.startDate).toLocaleDateString()} to {new Date(reviewingLeave.endDate).toLocaleDateString()}
              </p>
              <div style={{ background: "var(--surface-background)", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                Reason: "{reviewingLeave.reason}"
              </div>

              <div className={styles.inputGroup}>
                <label>Optional Review Remarks / HR Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Approved as per casual leave entitlement / Project deliverables pending..."
                ></textarea>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className="btn-secondary" onClick={() => setReviewingLeave(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={isPending}
                style={{
                  background: reviewStatus === "APPROVED" ? "#16A34A" : "#DC2626",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {isPending ? "Processing..." : reviewStatus === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- APPLY MODAL --- */}
      {isApplyModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsApplyModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <CalendarCheck size={20} color="var(--brand-primary)" />
                Submit Leave Application
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsApplyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await submitLeaveRequest(formData);
                  setIsApplyModalOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to submit leave application");
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
                  <label>Leave Type *</label>
                  <select name="type" required defaultValue="CASUAL">
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                  </select>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Start Date *</label>
                    <input type="date" name="startDate" required defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>End Date *</label>
                    <input type="date" name="endDate" required defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Reason for Leave *</label>
                  <textarea name="reason" rows={3} required placeholder="State reason for leave request..."></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsApplyModalOpen(false)}>
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
