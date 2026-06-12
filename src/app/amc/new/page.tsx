export const dynamic = "force-dynamic";
import { createAMC } from "../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import styles from "./page.module.css";

export default async function NewAMCPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/amc" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create New AMC</h1>
      </header>

      <form action={createAMC} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>AMC Details</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="title">AMC Title *</label>
            <input type="text" id="title" name="title" required placeholder="e.g. Server Maintenance 2024-25" autoComplete="off" />
          </div>
          
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="customerId">Associated Customer *</label>
              <select id="customerId" name="customerId" required>
                <option value="">-- Select Customer --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.company ? `(${customer.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="projectId">Associated Project</label>
              <select id="projectId" name="projectId">
                <option value="">-- No Project --</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="amount">Amount *</label>
            <input type="number" id="amount" name="amount" required step="0.01" min="0" placeholder="0.00" />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={3} placeholder="Additional details about the contract..." />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Timeline & Status</h2>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="status">Initial Status</label>
              <select id="status" name="status">
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="startDate">Start Date *</label>
              <input type="date" id="startDate" name="startDate" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="endDate">End Date *</label>
              <input type="date" id="endDate" name="endDate" required />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/amc" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Save size={18} />
            Save AMC
          </button>
        </div>
      </form>
    </div>
  );
}
