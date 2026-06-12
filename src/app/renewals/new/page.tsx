import { createRenewal } from "../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import styles from "./page.module.css";

export default async function NewRenewalPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/renewals" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Add New Renewal</h1>
      </header>

      <form action={createRenewal} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Service Details</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="customerId">Select Customer *</label>
            <select id="customerId" name="customerId" required>
              <option value="">-- Choose a Customer --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.company ? `(${customer.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="type">Service Type *</label>
              <select id="type" name="type" required>
                <option value="Domain">Domain Name</option>
                <option value="Hosting">Web Hosting</option>
                <option value="SSL">SSL Certificate</option>
                <option value="Maintenance">Maintenance Contract</option>
                <option value="Other">Other Service</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="expiryDate">Expiry Date *</label>
              <input type="date" id="expiryDate" name="expiryDate" required />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/renewals" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Save size={18} />
            Save Renewal
          </button>
        </div>
      </form>
    </div>
  );
}
