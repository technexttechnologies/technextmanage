import { markRenewed } from "../../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import styles from "../../new/page.module.css";
import { redirect } from "next/navigation";

export default async function RenewServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const renewal = await prisma.renewal.findUnique({
    where: { id: resolvedParams.id },
    include: { customer: true }
  });

  if (!renewal) {
    redirect("/renewals");
  }

  // Suggest a date 1 year from the current expiry
  const suggestedDate = new Date(renewal.expiryDate);
  suggestedDate.setFullYear(suggestedDate.getFullYear() + 1);
  const defaultDateStr = suggestedDate.toISOString().split('T')[0];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/renewals" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Process Renewal</h1>
      </header>

      <form action={markRenewed} className={styles.formCard}>
        <input type="hidden" name="renewalId" value={renewal.id} />
        
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Service Details</h2>
          <p><strong>Customer:</strong> {renewal.customer.name}</p>
          <p><strong>Service Type:</strong> {renewal.type}</p>
          <p><strong>Current Expiry:</strong> {new Date(renewal.expiryDate).toLocaleDateString()}</p>
          
          <div className={styles.inputGroup} style={{marginTop: '24px'}}>
            <label htmlFor="newExpiryDate">New Expiry Date *</label>
            <input type="date" id="newExpiryDate" name="newExpiryDate" defaultValue={defaultDateStr} required />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/renewals" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <RefreshCw size={18} />
            Confirm Renewal
          </button>
        </div>
      </form>
    </div>
  );
}
