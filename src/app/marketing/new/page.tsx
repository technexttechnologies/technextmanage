import { launchCampaign } from "../actions";
import Link from "next/link";
import { ArrowLeft, Send, Info } from "lucide-react";
import styles from "./page.module.css";

export default function NewCampaignPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/marketing" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create Marketing Campaign</h1>
      </header>

      <form action={launchCampaign} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Campaign Details</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="name">Campaign Name *</label>
            <input type="text" id="name" name="name" required placeholder="e.g. Diwali Special Offer" autoComplete="off" />
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="subject">Email Subject *</label>
              <input type="text" id="subject" name="subject" required placeholder="Subject line for your email" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="audience">Target Audience *</label>
              <select id="audience" name="audience" required>
                <option value="ALL">All Customers</option>
                <option value="ACTIVE">Active Customers</option>
                <option value="RENEWAL_DUE">Renewal Due Customers</option>
                <option value="LEAD">Leads & Prospects</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Email Content</h2>
          
          <div className={styles.tipBox}>
            <Info size={20} className={styles.tipIcon} />
            <div>
              <strong>Pro Tip:</strong> You can use <code>{"{{name}}"}</code> and <code>{"{{company}}"}</code> as dynamic variables in the body. They will be automatically replaced with the customer's actual details.
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="body">Email Body (HTML or Text) *</label>
            <textarea 
              id="body" 
              name="body" 
              required 
              placeholder="<p>Dear {{name}},</p><p>We have a special offer for {{company}}...</p>" 
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/marketing" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Send size={18} />
            Launch Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
