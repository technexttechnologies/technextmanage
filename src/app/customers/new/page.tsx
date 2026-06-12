import { createCustomer } from "../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import styles from "./page.module.css";

export default function NewCustomerPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/customers" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Add New Customer</h1>
      </header>

      <form action={createCustomer} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Contact Person Name *</label>
            <input type="text" id="name" name="name" required placeholder="e.g. John Doe" autoComplete="off" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="company">Company Name</label>
            <input type="text" id="company" name="company" placeholder="e.g. Tech Solutions Inc." autoComplete="off" />
          </div>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Phone Number *</label>
              <input type="tel" id="phone" name="phone" required placeholder="e.g. +91 9876543210" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="e.g. john@example.com" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Business Details</h2>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="status">Initial Status</label>
              <select id="status" name="status">
                <option value="LEAD">Lead (Enquiry)</option>
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active Customer</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="gstNumber">GST Number</label>
              <input type="text" id="gstNumber" name="gstNumber" placeholder="Optional" />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="address">Address</label>
            <textarea id="address" name="address" rows={2} placeholder="Full address..." />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="notes">Internal Notes</label>
            <textarea id="notes" name="notes" rows={3} placeholder="Any specific requirements or context..." />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/customers" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Save size={18} />
            Save Customer
          </button>
        </div>
      </form>
    </div>
  );
}
