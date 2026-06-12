export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Filter, Briefcase, Calendar, CheckSquare, Clock } from "lucide-react";
import styles from "./page.module.css";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const currentStatus = (await searchParams).status || "ALL";

  const projects = await prisma.project.findMany({
    where: currentStatus === "ALL" ? {} : { status: currentStatus },
    include: {
      customer: true,
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Manage ongoing client deliveries and implementations.</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>New Project</span>
        </Link>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          <Link href="/projects" className={`${styles.filterTab} ${currentStatus === "ALL" ? styles.activeTab : ""}`}>
            All Projects
          </Link>
          <Link href="/projects?status=PLANNING" className={`${styles.filterTab} ${currentStatus === "PLANNING" ? styles.activeTab : ""}`}>
            Planning
          </Link>
          <Link href="/projects?status=IN_PROGRESS" className={`${styles.filterTab} ${currentStatus === "IN_PROGRESS" ? styles.activeTab : ""}`}>
            In Progress
          </Link>
          <Link href="/projects?status=ON_HOLD" className={`${styles.filterTab} ${currentStatus === "ON_HOLD" ? styles.activeTab : ""}`}>
            On Hold
          </Link>
          <Link href="/projects?status=COMPLETED" className={`${styles.filterTab} ${currentStatus === "COMPLETED" ? styles.activeTab : ""}`}>
            Completed
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className={styles.emptyState}>
          <Briefcase size={48} className={styles.emptyIcon} />
          <h2>No projects found</h2>
          <p>You have no projects matching this status.</p>
          <Link href="/projects/new" className="btn-primary" style={{marginTop: '16px'}}>
            Create New Project
          </Link>
        </div>
      ) : (
        <div className={styles.projectList}>
          {projects.map(project => (
            <div key={project.id} className={styles.projectCard}>
              <Link href={`/projects/${project.id}`} className={styles.cardHeaderLink}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardInfo}>
                    <h3>{project.name}</h3>
                    {project.customer && (
                      <p className={styles.customerName}>
                        For: {project.customer.name} {project.customer.company ? `(${project.customer.company})` : ''}
                      </p>
                    )}
                  </div>
                  <span className={`${styles.statusBadge} ${styles[project.status.toLowerCase()] || styles.default}`}>
                    {project.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
              
              {project.description && (
                <p className={styles.description}>{project.description.length > 80 ? project.description.substring(0, 80) + "..." : project.description}</p>
              )}

              <div className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <CheckSquare size={16} />
                  <span>{project._count.tasks} Tasks</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
