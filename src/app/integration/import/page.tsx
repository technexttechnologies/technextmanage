import { importAroniumData } from "../actions";
import Link from "next/link";
import { ArrowLeft, UploadCloud, AlertTriangle } from "lucide-react";
import styles from "../../projects/new/page.module.css";

export default function ImportPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/integration" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Hub</span>
        </Link>
        <h1 className={styles.title}>Import Aronium CSV</h1>
      </header>

      <form action={importAroniumData} className={styles.formCard} encType="multipart/form-data">
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            <UploadCloud size={20} /> Upload Data File
          </h2>
          
          <div style={{
            backgroundColor: '#FEF3C7', 
            border: '1px solid #F59E0B', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={20} style={{color: '#D97706', flexShrink: 0}} />
            <div style={{fontSize: '13px', color: '#92400E'}}>
              <strong>Important Formatting Rules:</strong>
              <ul style={{marginTop: '8px', paddingLeft: '20px'}}>
                <li>File must be a standard CSV (.csv)</li>
                <li><strong>Customers CSV</strong> must have headers: <code>Name, Phone, Email, AroniumCode</code></li>
                <li><strong>Quotations CSV</strong> must have headers: <code>QuotationNumber, CustomerName, Date, TotalAmount</code></li>
              </ul>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="type">Import Data Type *</label>
            <select id="type" name="type" required>
              <option value="CUSTOMERS">Customers Database</option>
              <option value="QUOTATIONS">Quotations History</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="csvFile">CSV File *</label>
            <input type="file" id="csvFile" name="csvFile" accept=".csv" required />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/integration" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <UploadCloud size={18} />
            Start Import
          </button>
        </div>
      </form>
    </div>
  );
}
