
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createAsset } from "../actions";
import styles from "../page.module.css";

export default async function NewAssetPage() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Add New Asset</h1>
          <p className={styles.subtitle}>Register a new company asset.</p>
        </div>
      </div>

      <div className={styles.formContainer}>
        <form action={createAsset}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Asset ID *</label>
            <input name="assetId" required className={styles.input} placeholder="AST-001" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Asset Name *</label>
            <input name="name" required className={styles.input} placeholder="MacBook Pro 16" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Category *</label>
            <select name="category" required className={styles.select}>
              <option value="">Select Category</option>
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
              <option value="Server">Server</option>
              <option value="Printer">Printer</option>
              <option value="Mobile Device">Mobile Device</option>
              <option value="Network Equipment">Network Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Purchase Date *</label>
            <input type="date" name="purchaseDate" required className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Purchase Cost (₹) *</label>
            <input type="number" step="0.01" name="purchaseCost" required className={styles.input} placeholder="150000" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Warranty End Date</label>
            <input type="date" name="warrantyEnd" className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Status</label>
            <select name="status" className={styles.select} defaultValue="ACTIVE">
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Assign To User</label>
            <select name="assignedToId" className={styles.select}>
              <option value="">-- Unassigned --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Maintenance History / Notes</label>
            <textarea name="maintenanceHistory" className={styles.textarea} placeholder="Notes on repairs or maintenance..." />
          </div>

          <div style={{ marginTop: "2rem" }}>
            <Link href="/erp/assets" className={styles.cancelBtn}>Cancel</Link>
            <button type="submit" className={styles.submitBtn}>Save Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
