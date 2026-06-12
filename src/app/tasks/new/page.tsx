export const dynamic = "force-dynamic";
import { createTask } from "../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import styles from "./page.module.css";

export default async function NewTaskPage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: "COMPLETED" } },
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/tasks" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create New Task</h1>
      </header>

      <form action={createTask} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Task Details</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="title">Task Title *</label>
            <input type="text" id="title" name="title" required placeholder="e.g. Follow up on proposal" autoComplete="off" />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="projectId">Associated Project</label>
            <select id="projectId" name="projectId">
              <option value="">-- Standalone Task --</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} placeholder="Task details or instructions..." />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="dueDate">Due Date</label>
            <input type="date" id="dueDate" name="dueDate" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/tasks" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Save size={18} />
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
}
