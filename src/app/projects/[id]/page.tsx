import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import styles from "./page.module.css";
import ProjectDetailsClient from "./ProjectDetailsClient";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      customer: true,
      assignedTo: true,
      notes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] },
      milestones: { orderBy: { dueDate: 'asc' } },
      tasks: true
    }
  });

  if (!project) return notFound();

  // Fetch activity logs related to this project
  const activityLogs = await prisma.activityLog.findMany({
    where: { entityId: project.id, entityType: "PROJECT" },
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  const projectWithLogs = {
    ...project,
    activityLogs
  };

  return (
    <div className={styles.container}>
      <Link href="/projects" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{project.name}</h1>
          <span className={styles.sourceTag}>Type: {project.type || "General"}</span>
          {project.customer && (
            <span className={styles.sourceTag} style={{marginLeft: '8px', background: '#DBEAFE', color: '#1E40AF'}}>
              Client: {project.customer.name}
            </span>
          )}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#FEE2E2', color: '#B91C1C', padding: '6px 12px', borderRadius: '8px', fontWeight: '500', fontSize: '14px'}}>
          <Clock size={16} /> ETA: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
        </div>
      </header>

      <ProjectDetailsClient project={projectWithLogs} />
    </div>
  );
}
