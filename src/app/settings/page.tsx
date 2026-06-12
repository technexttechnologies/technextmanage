export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { UserPlus, Shield, Trash2, Settings as SettingsIcon } from "lucide-react";
import styles from "./page.module.css";
import { createEmployee, deleteEmployee, updatePlatformSettings } from "./actions";
import { DeleteButton } from "./DeleteButton";
import Link from "next/link";

export default async function SettingsPage() {
  const settings = await prisma.systemSettings.findFirst();
  const employees = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          customers: true,
          projects: true,
          tasks: true
        }
      }
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Manage employees, roles, and platform configuration.</p>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <UserPlus size={20} />
              Add New Employee
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
                <label htmlFor="password">Temporary Password *</label>
                <input type="text" id="password" name="password" required placeholder="e.g. ChangeMe123!" />
              </div>

              <button type="submit" className="btn-primary" style={{width: '100%'}}>
                Create Account
              </button>
            </form>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Shield size={20} />
              Employee Roster
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
                      <span className={`${styles.roleBadge} ${styles[emp.role.toLowerCase()] || styles.defaultRole}`}>
                        {emp.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.empStats}>
                    <span>{emp._count.customers} Customers</span> • 
                    <span>{emp._count.projects} Projects</span> • 
                    <span>{emp._count.tasks} Tasks</span>
                  </div>
                  
                  <form action={deleteEmployee}>
                    <input type="hidden" name="userId" value={emp.id} />
                    <DeleteButton />
                  </form>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card} style={{marginTop: 'var(--spacing-6)'}}>
            <h2 className={styles.cardTitle}>
              <SettingsIcon size={20} />
              Platform Configuration
            </h2>
            <form action={updatePlatformSettings} style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
              <div className={styles.inputGroup}>
                <label htmlFor="geminiApiKey">Google Gemini API Key</label>
                <input type="password" id="geminiApiKey" name="geminiApiKey" defaultValue={settings?.geminiApiKey || ""} placeholder="AIxxxxxxxxxxxxxxxxxxxx" />
              </div>
              <button type="submit" className="btn-secondary" style={{width: 'fit-content'}}>Save Settings</button>
            </form>

            <div style={{marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)'}}>
              <h3 style={{fontSize: '14px', marginBottom: '12px'}}>Communication</h3>
              <Link href="/settings/templates" className="btn-secondary" style={{display: 'flex', justifyContent: 'center'}}>
                Manage Email & WhatsApp Templates
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
