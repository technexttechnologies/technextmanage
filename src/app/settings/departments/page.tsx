export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createDepartment, deleteDepartment } from "./actions";
import { Users, Trash2 } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";

export default async function DepartmentsPage() {
  const session = await getSession();
  if (!session?.userId) {
    return <div>Unauthorized</div>;
  }
  
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return <div>Forbidden - You do not have permission to view this page.</div>;
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Departments</h1>
          <p className={styles.subtitle}>Manage company departments.</p>
        </div>
        <Link href="/settings" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
          &larr; Back to Settings
        </Link>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Create Department</h2>
          <form action={createDepartment}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Department Name</label>
              <input type="text" name="name" id="name" className={styles.input} required placeholder="e.g. Engineering" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea name="description" id="description" className={styles.textarea} placeholder="Brief description of this department..."></textarea>
            </div>
            <button type="submit" className={styles.submitBtn}>Create Department</button>
          </form>
        </div>

        <div className={styles.card} style={{ backgroundColor: 'transparent', boxShadow: 'none', padding: 0 }}>
          <h2 className={styles.cardTitle} style={{ borderBottom: 'none', marginBottom: '1rem' }}>Existing Departments</h2>
          {departments.length === 0 ? (
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
              No departments created yet.
            </div>
          ) : (
            <div className={styles.grid}>
              {departments.map(dept => (
                <div key={dept.id} className={styles.deptCard}>
                  <form action={deleteDepartment.bind(null, dept.id)} className={styles.deleteForm}>
                    <button type="submit" className={styles.deleteBtn} title={dept._count.users > 0 ? "Cannot delete department with users" : "Delete department"} disabled={dept._count.users > 0}>
                      <Trash2 size={18} />
                    </button>
                  </form>
                  <h3 className={styles.deptName}>{dept.name}</h3>
                  <p className={styles.deptDesc}>{dept.description || 'No description provided.'}</p>
                  <div className={styles.deptMeta}>
                    <Users size={16} />
                    <span>{dept._count.users} Member{dept._count.users !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
