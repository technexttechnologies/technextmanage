"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  GraduationCap, Plus, Search, BookOpen, Clock, Users, 
  MapPin, Calendar, ArrowRight, X, Sparkles
} from "lucide-react";
import styles from "../faculty-shared.module.css";
import { createBatch, createCourse } from "../actions";

export default function BatchesClient({
  batches,
  courses,
  faculties,
}: {
  batches: any[];
  courses: any[];
  faculties: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredBatches = batches.filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesMode = modeFilter === "ALL" || b.mode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            <GraduationCap size={24} color="var(--brand-primary)" />
            Training Batches & Courses
          </h1>
          <p className={styles.headerSubtitle}>
            Manage courses, academic batches, class schedules, and student enrolment.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setActionError(null);
              setIsAddCourseOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <BookOpen size={16} /> New Course
          </button>

          <button 
            type="button" 
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsAddBatchOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Create Batch
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by batch name, code, or course title..." 
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
          <option value="ALL">All Status</option>
          <option value="ONGOING">Ongoing</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
        >
          <option value="ALL">All Modes</option>
          <option value="OFFLINE">Offline (In-Person)</option>
          <option value="ONLINE">Online (Live / Meet)</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      {/* Batches Grid */}
      <div className={styles.grid}>
        {filteredBatches.length === 0 ? (
          <div className={styles.emptyState}>
            <GraduationCap size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No training batches found</h3>
            <p>Create a new batch or adjust your search filter above.</p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <div key={batch.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardTitle}>{batch.name}</h3>
                  <p className={styles.cardSubtitle}>{batch.course.title}</p>
                </div>
                <span className={`${styles.badge} ${
                  batch.status === "ONGOING" 
                    ? styles.badgeOngoing 
                    : batch.status === "UPCOMING" 
                    ? styles.badgeUpcoming 
                    : styles.badgeCompleted
                }`}>
                  {batch.status}
                </span>
              </div>

              <div className={styles.cardMetaList}>
                <div className={styles.metaRow}>
                  <Users size={15} />
                  <span><strong>{batch._count?.students || 0}</strong> Students Enrolled</span>
                </div>
                {batch.schedule && (
                  <div className={styles.metaRow}>
                    <Clock size={15} />
                    <span>{batch.schedule}</span>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <MapPin size={15} />
                  <span>{batch.classroom || "Assigned Classroom"} ({batch.mode})</span>
                </div>
                <div className={styles.metaRow}>
                  <Calendar size={15} />
                  <span>Started: {new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
                  Code: <code>{batch.batchCode}</code>
                </span>

                <Link 
                  href={`/faculty/batches/${batch.id}`} 
                  className="btn-primary" 
                  style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  Manage Batch <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- CREATE BATCH MODAL --- */}
      {isAddBatchOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddBatchOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <GraduationCap size={20} color="var(--brand-primary)" />
                Create New Training Batch
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddBatchOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createBatch(formData);
                  setIsAddBatchOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to create batch");
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
                  <label>Batch Name *</label>
                  <input type="text" name="name" required placeholder="e.g. MERN Full Stack - Morning Batch 2026" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Batch Code *</label>
                    <input type="text" name="batchCode" required placeholder="e.g. FSWD-2026-A" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Course Curriculum *</label>
                    <select name="courseId" required>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Assigned Faculty / Trainer</label>
                    <select name="facultyId">
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Delivery Mode</label>
                    <select name="mode" defaultValue="OFFLINE">
                      <option value="OFFLINE">Offline (In-Person Lab)</option>
                      <option value="ONLINE">Online (Live Virtual)</option>
                      <option value="HYBRID">Hybrid (Offline + Online)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Start Date *</label>
                    <input type="date" name="startDate" required defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Schedule / Timings</label>
                    <input type="text" name="schedule" placeholder="e.g. Mon-Fri 09:30 AM - 12:30 PM" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Classroom / Meet Link</label>
                  <input type="text" name="classroom" placeholder="e.g. Lab 2 / https://meet.google.com/..." />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddBatchOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE COURSE MODAL --- */}
      {isAddCourseOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddCourseOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <BookOpen size={20} color="var(--brand-primary)" />
                Add New Course Curriculum
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddCourseOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createCourse(formData);
                  setIsAddCourseOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to create course");
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
                  <label>Course Title *</label>
                  <input type="text" name="title" required placeholder="e.g. Advanced AI & LLM Systems" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Course Code *</label>
                    <input type="text" name="code" required placeholder="e.g. AI-801" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Duration *</label>
                    <input type="text" name="duration" required placeholder="e.g. 6 Months / 120 Hours" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Category</label>
                  <input type="text" name="category" placeholder="e.g. Software Development, AI/ML, Cloud" />
                </div>

                <div className={styles.inputGroup}>
                  <label>Description</label>
                  <textarea name="description" rows={3} placeholder="Course highlights and learning outcomes..."></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddCourseOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Creating..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
