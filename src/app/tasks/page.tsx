import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, CheckCircle, Clock, PlayCircle, Filter } from "lucide-react";
import styles from "./page.module.css";
import { updateTaskStatus } from "./actions";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const currentStatus = (await searchParams).status || "ALL";

  const tasks = await prisma.task.findMany({
    where: currentStatus === "ALL" ? {} : { status: currentStatus },
    include: {
      project: true,
      assignedTo: true
    },
    orderBy: { dueDate: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>Manage your daily to-dos and project tasks.</p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add Task</span>
        </Link>
      </header>

      <div className={styles.filterScroll}>
        <Link href="/tasks" className={`${styles.filterTab} ${currentStatus === "ALL" ? styles.activeTab : ""}`}>
          All Tasks
        </Link>
        <Link href="/tasks?status=PENDING" className={`${styles.filterTab} ${currentStatus === "PENDING" ? styles.activeTab : ""}`}>
          Pending
        </Link>
        <Link href="/tasks?status=IN_PROGRESS" className={`${styles.filterTab} ${currentStatus === "IN_PROGRESS" ? styles.activeTab : ""}`}>
          In Progress
        </Link>
        <Link href="/tasks?status=COMPLETED" className={`${styles.filterTab} ${currentStatus === "COMPLETED" ? styles.activeTab : ""}`}>
          Completed
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle size={48} className={styles.emptyIcon} />
          <h2>All caught up!</h2>
          <p>You have no tasks matching this status.</p>
        </div>
      ) : (
        <div className={styles.taskList}>
          {tasks.map(task => (
            <div key={task.id} className={`${styles.taskCard} ${styles[task.status.toLowerCase()]}`}>
              <div className={styles.taskContent}>
                <h3>{task.title}</h3>
                {task.description && <p className={styles.description}>{task.description}</p>}
                
                <div className={styles.meta}>
                  {task.project && (
                    <span className={styles.projectTag}>{task.project.name}</span>
                  )}
                  {task.dueDate && (
                    <span className={`${styles.dueDate} ${new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" ? styles.overdue : ""}`}>
                      <Clock size={14} /> {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              <form action={updateTaskStatus} className={styles.taskActions}>
                <input type="hidden" name="taskId" value={task.id} />
                
                {task.status === "PENDING" && (
                  <button type="submit" name="status" value="IN_PROGRESS" className={`${styles.actionBtn} ${styles.startBtn}`}>
                    <PlayCircle size={18} /> Start
                  </button>
                )}
                
                {task.status === "IN_PROGRESS" && (
                  <button type="submit" name="status" value="COMPLETED" className={`${styles.actionBtn} ${styles.completeBtn}`}>
                    <CheckCircle size={18} /> Complete
                  </button>
                )}
                
                {task.status === "COMPLETED" && (
                  <span className={styles.completedBadge}>
                    <CheckCircle size={18} /> Done
                  </span>
                )}
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
