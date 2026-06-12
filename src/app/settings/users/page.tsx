export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { UserPlus, Shield, KeyRound, ArrowLeft } from "lucide-react";
import styles from "./page.module.css";
import { createEmployee, deleteEmployee, resetUserPassword } from "./actions";
import { DeleteButton } from "../DeleteButton";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
  const session = await getSession();
  
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    redirect("/"); // Only Admins can access this page
  }

  const employees = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className={styles.container}>
      <Link href="/settings" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Settings
      </Link>
      
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage system access, roles, and reset user passwords securely.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Add User Column */}
        <div>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <UserPlus size={20} />
              Add New User
            </h2>
            <form action={createEmployee} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Full Name *</label>
                <input type="text" id="name" name="name" required placeholder="e.g. John Doe" />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="john@technext.com" />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="role">System Role *</label>
                <select id="role" name="role" required>
                  <option value="SALES">Sales Representative</option>
                  <option value="PROJECT">Project Manager</option>
                  <option value="SUPPORT">Support Agent</option>
                  <option value="HEAD">Department Head</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Initial Password *</label>
                <input type="text" id="password" name="password" required placeholder="e.g. ChangeMe123!" />
                <p style={{fontSize: '11px', color: 'var(--text-muted)'}}>This will be securely encrypted.</p>
              </div>

              <button type="submit" className="btn-primary" style={{width: '100%'}}>
                Create Account
              </button>
            </form>
          </section>
        </div>

        {/* Existing Users Column */}
        <div>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Shield size={20} />
              Current Users
            </h2>
            
            <div className={styles.employeeList}>
              {employees.map(emp => (
                <div key={emp.id} className={styles.employeeItem}>
                  <div className={styles.empInfo}>
                    <div className={styles.avatar}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{emp.name}</h3>
                      <p>{emp.email}</p>
                      <span className={`${styles.roleBadge} ${styles[emp.role.toLowerCase()] || styles.defaultRole}`}>
                        {emp.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.empActions}>
                    <form action={resetUserPassword} className={styles.resetForm}>
                      <input type="hidden" name="userId" value={emp.id} />
                      <input type="text" name="newPassword" className={styles.resetInput} placeholder="New password..." required minLength={6} />
                      <button type="submit" className={styles.resetBtn} title="Reset Password">
                        <KeyRound size={14} /> Reset
                      </button>
                    </form>

                    <form action={deleteEmployee}>
                      <input type="hidden" name="userId" value={emp.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
