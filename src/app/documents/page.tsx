import { Cloud, ExternalLink, FileText, Lock } from "lucide-react";
import styles from "./page.module.css";

export default function DocumentsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Document Storage</h1>
          <p className={styles.subtitle}>Manage client assets, agreements, and files.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Cloud size={48} className={styles.icon} />
        </div>
        
        <h2>Cloud Storage Recommended</h2>
        <p className={styles.description}>
          To keep your TechNext CRM fast and lightweight, we recommend utilizing an external cloud storage provider (like Google Drive, OneDrive, or Dropbox) for heavy client assets, signed agreements, and media files.
        </p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <h3>Upload to Cloud</h3>
              <p>Upload your client's files to a dedicated folder in your preferred cloud storage.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <h3>Generate a Link</h3>
              <p>Create a shareable link to the folder or specific document.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <h3>Paste in CRM</h3>
              <p>Paste the link into the specific Customer's <strong>Notes</strong> section or within a specific <strong>Project's description</strong> for quick access by the entire team.</p>
            </div>
          </div>
        </div>

        <div className={styles.securityNote}>
          <Lock size={16} />
          <span>This ensures your CRM database remains blazingly fast and your documents remain securely backed up.</span>
        </div>
      </div>
    </div>
  );
}
