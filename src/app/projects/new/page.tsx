import { createProject } from "../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import styles from "./page.module.css";

export default async function NewProjectPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/projects" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create New Project</h1>
      </header>

      <form action={createProject} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Project Overview</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Project Name *</label>
            <input type="text" id="name" name="name" required placeholder="e.g. Website Redesign" autoComplete="off" />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="customerId">Associated Customer</label>
            <select id="customerId" name="customerId">
              <option value="">-- No Customer (Internal Project) --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.company ? `(${customer.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="description">Project Description</label>
            <textarea id="description" name="description" rows={3} placeholder="Briefly describe the project goals..." />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Timeline & Status</h2>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="status">Initial Status</label>
              <select id="status" name="status">
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="endDate">Estimated End Date</label>
              <input type="date" id="endDate" name="endDate" />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/projects" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Save size={18} />
            Save Project
          </button>
        </div>
      </form>
    </div>
  );
}
