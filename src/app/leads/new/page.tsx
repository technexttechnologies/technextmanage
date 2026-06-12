import { createLead } from "../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import styles from "./page.module.css";

export default function NewLeadPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/leads" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create New Lead</h1>
      </header>

      <form action={createLead} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Lead Information</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Lead Name *</label>
            <input type="text" id="name" name="name" required placeholder="e.g. Jane Smith" autoComplete="off" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="company">Company / Organization</label>
            <input type="text" id="company" name="company" placeholder="e.g. Acme Corp" autoComplete="off" />
          </div>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" placeholder="e.g. +91 9876543210" autoComplete="off" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="e.g. jane@example.com" autoComplete="off" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Acquisition Details</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="source">Lead Source</label>
            <select id="source" name="source">
              <option value="Website">Website Form</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Social Media">Social Media</option>
              <option value="Advertisement">Advertisement</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="notes">Initial Requirements / Notes</label>
            <textarea id="notes" name="notes" rows={4} placeholder="What is the lead looking for?..." />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/leads" className="btn-secondary">Cancel</Link>
          <SubmitButton icon={<Save size={18} />}>Save Lead</SubmitButton>
        </div>
      </form>
    </div>
  );
}
