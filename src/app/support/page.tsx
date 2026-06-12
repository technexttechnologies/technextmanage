import styles from "./page.module.css";
import SupportForm from "./SupportForm";
import { HeadphonesIcon } from "lucide-react";

export const metadata = {
  title: "Support - Technext Technologies",
  description: "Submit a support ticket",
};

export default function SupportPage() {
  return (
    <div className={styles.publicContainer}>
      <header className={styles.publicHeader}>
        <div className={styles.brandName} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" alt="TECHNEXT Logo" style={{ height: '32px', width: 'auto' }} />
          TECHNEXT Support
        </div>
      </header>

      <div className={styles.formWrapper}>
        <div className={styles.formCard}>
          <h1 className={styles.formTitle}>How can we help you?</h1>
          <p className={styles.formSubtitle}>
            Submit a support ticket and our team will get back to you as soon as possible.
          </p>
          <SupportForm />
        </div>
      </div>
    </div>
  );
}
