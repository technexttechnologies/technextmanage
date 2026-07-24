import React from 'react';
import styles from './page.module.css';
import { saveAroniumConfig } from '../actions';
import { redirect } from 'next/navigation';

export default function AroniumSetupPage() {
  async function handleSubmit(formData: FormData) {
    'use server';
    await saveAroniumConfig(formData);
    redirect('/erp/integrations/aronium');
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Aronium ERP Integration Setup</h1>
        <p className={styles.subtitle}>Configure the connection to your local Aronium POS database</p>
      </div>

      <div className={styles.formCard}>
        <form action={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="companyName">Company Name</label>
            <input className={styles.input} type="text" id="companyName" name="companyName" defaultValue="TechNext HQ" required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="branchName">Branch Name</label>
            <input className={styles.input} type="text" id="branchName" name="branchName" defaultValue="Main Branch" required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="dbType">Database Type</label>
            <select className={styles.input} id="dbType" name="dbType" defaultValue="SQLITE">
              <option value="SQLITE">SQLite (Default)</option>
              <option value="SQLSERVER">SQL Server</option>
              <option value="FIREBIRD">Firebird</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="dbPathOrHost">DB Path / Host</label>
            <input className={styles.input} type="text" id="dbPathOrHost" name="dbPathOrHost" defaultValue="C:\ProgramData\Aronium\Data\aronium.db" required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="port">Port (Optional)</label>
            <input className={styles.input} type="number" id="port" name="port" placeholder="e.g. 1433" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">Username (Optional)</label>
            <input className={styles.input} type="text" id="username" name="username" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password (Optional)</label>
            <input className={styles.input} type="password" id="password" name="password" />
          </div>

          <div className={styles.checkboxGroup}>
            <input className={styles.checkbox} type="checkbox" id="autoSync" name="autoSync" defaultChecked />
            <label className={styles.label} htmlFor="autoSync" style={{ marginBottom: 0 }}>Enable Auto-Sync</label>
          </div>

          <button type="submit" className={styles.button}>Save & Generate Sync Token</button>
        </form>
      </div>
    </div>
  );
}
