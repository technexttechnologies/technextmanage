export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { 
  GraduationCap, Users, CalendarCheck, FileCheck, Clock, 
  BookOpen, Plus, ArrowRight, CheckCircle2, AlertCircle, 
  Sparkles, Calendar, MapPin
} from "lucide-react";
import styles from "./page.module.css";
import { seedDemoFacultyData } from "./actions";

export default async function FacultyDashboardPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  // Check if initial setup is needed
  const courseCount = await prisma.course.count();
  if (courseCount === 0) {
    await seedDemoFacultyData();
  }

  // Fetch batches
  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const [batches, totalStudents, pendingSubmissions, recentSessions, totalAssignments] = await Promise.all([
    prisma.facultyBatch.findMany({
      where: batchWhere,
      include: {
        course: true,
        faculty: true,
        _count: {
          select: { students: true, assignments: true, sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({
      where: isAdmin ? {} : { batch: { facultyId: session?.userId as string } },
    }),
    prisma.assignmentSubmission.count({
      where: { status: "PENDING" },
    }),
    prisma.facultySession.findMany({
      include: {
        batch: { include: { course: true } },
      },
      orderBy: { sessionDate: "desc" },
      take: 5,
    }),
    prisma.facultyAssignment.count({
      where: isAdmin ? {} : { facultyId: session?.userId as string },
    }),
  ]);

  const ongoingBatches = batches.filter(b => b.status === "ONGOING");

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Metrics Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(99, 91, 255, 0.1)", color: "var(--brand-primary)" }}>
            <GraduationCap size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{ongoingBatches.length}</span>
            <span className={styles.statLabel}>Active Batches</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalStudents}</span>
            <span className={styles.statLabel}>Enrolled Students</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#D97706" }}>
            <FileCheck size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{pendingSubmissions}</span>
            <span className={styles.statLabel}>Submissions to Grade</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563EB" }}>
            <BookOpen size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalAssignments}</span>
            <span className={styles.statLabel}>Course Assignments</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className={styles.quickActionsCard}>
        <h2 className={styles.sectionTitle}>
          <Sparkles size={18} color="var(--brand-accent)" />
          Quick Actions & Operations
        </h2>
        <div className={styles.actionsRow}>
          <Link href="/faculty/attendance" className={styles.actionBtn}>
            <CalendarCheck size={16} /> Mark Today's Attendance
          </Link>
          <Link href="/faculty/assignments" className={styles.actionBtn}>
            <Plus size={16} /> Create Assignment
          </Link>
          <Link href="/faculty/sessions" className={styles.actionBtn}>
            <Clock size={16} /> Log Class / Lecture
          </Link>
          <Link href="/faculty/materials" className={styles.actionBtn}>
            <BookOpen size={16} /> Share Study Material
          </Link>
          <Link href="/faculty/students" className={styles.actionBtn}>
            <Users size={16} /> Enroll New Student
          </Link>
          <Link href="/faculty/batches" className={styles.actionBtn}>
            <GraduationCap size={16} /> Create New Batch
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.mainGrid}>
        {/* Left Column: Active Batches */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>
              <GraduationCap size={20} />
              Assigned Training Batches ({batches.length})
            </h2>
            <Link href="/faculty/batches" className={styles.viewAllLink}>
              View All Batches <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className={styles.emptyBox}>No active training batches assigned.</div>
          ) : (
            <div className={styles.batchList}>
              {batches.map((batch) => (
                <div key={batch.id} className={styles.batchCard}>
                  <div className={styles.batchInfo}>
                    <h3>{batch.name}</h3>
                    <p className={styles.batchCourse}>{batch.course.title} ({batch.batchCode})</p>
                    <div className={styles.batchMeta}>
                      <span className={styles.metaItem}>
                        <Users size={14} /> {batch._count.students} Students
                      </span>
                      {batch.schedule && (
                        <span className={styles.metaItem}>
                          <Clock size={14} /> {batch.schedule}
                        </span>
                      )}
                      {batch.classroom && (
                        <span className={styles.metaItem}>
                          <MapPin size={14} /> {batch.classroom}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <span className={`${styles.batchBadge} ${
                      batch.status === "ONGOING" 
                        ? styles.badgeOngoing 
                        : batch.status === "UPCOMING" 
                        ? styles.badgeUpcoming 
                        : styles.badgeCompleted
                    }`}>
                      {batch.status}
                    </span>

                    <Link 
                      href={`/faculty/batches/${batch.id}`} 
                      className="btn-secondary" 
                      style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      Manage Batch <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Today's Timetable & Recent Class Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Class Timetable */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Calendar size={18} />
                Today's Class Schedule
              </h2>
            </div>

            <div className={styles.scheduleList}>
              {ongoingBatches.length === 0 ? (
                <div className={styles.emptyBox}>No classes scheduled for today.</div>
              ) : (
                ongoingBatches.map((batch) => (
                  <div key={batch.id} className={styles.scheduleItem}>
                    <span className={styles.scheduleTime}>
                      <Clock size={14} /> {batch.schedule || "Regular Session"}
                    </span>
                    <h4 className={styles.scheduleTitle}>{batch.name}</h4>
                    <span className={styles.scheduleVenue}>
                      Venue / Link: {batch.classroom || "Assigned Classroom"} ({batch.mode})
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Lecture Logs */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Clock size={18} />
                Recent Lecture Logs
              </h2>
              <Link href="/faculty/sessions" className={styles.viewAllLink}>
                All Logs
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className={styles.emptyBox}>No lecture sessions recorded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recentSessions.map((session) => (
                  <div key={session.id} style={{ padding: "10px 12px", border: "1px solid var(--surface-border)", borderRadius: "8px", background: "var(--surface-background)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                      <span>{session.batch.name}</span>
                      <span>{new Date(session.sessionDate).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                      {session.topicCovered}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
