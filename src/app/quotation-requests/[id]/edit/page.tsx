import { prisma } from "@/lib/prisma";
import { updateQuotationRequest } from "../../actions";
import Link from "next/link";
import styles from "../../page.module.css";
import { notFound } from "next/navigation";
import { ArrowLeft, Save, Briefcase, FileText, DollarSign, AlertCircle } from "lucide-react";

export default async function EditQuotationRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.quotationRequest.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!request) return notFound();

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: "24px" }}>
        <Link href={`/quotation-requests/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Back to Request
        </Link>
      </div>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Quotation Request</h1>
          <p className={styles.subtitle}>Update request details for <strong style={{color: 'var(--brand-primary)'}}>{request.customer.name}</strong>.</p>
        </div>
      </header>

      <div className={styles.card}>
        <form action={updateQuotationRequest}>
          <input type="hidden" name="id" value={request.id} />

          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} color="var(--brand-primary)" /> Service Name</label>
              <input type="text" name="serviceName" required defaultValue={request.serviceName} style={{ padding: '12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} color="var(--brand-primary)" /> Budget (Optional)</label>
              <input type="text" name="budget" defaultValue={request.budget || ""} style={{ padding: '12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={16} color="var(--brand-primary)" /> Priority</label>
              <select name="priority" defaultValue={request.priority} style={{ padding: '12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} color="var(--brand-primary)" /> Requirement Details</label>
              <textarea name="requirementDetails" rows={6} required defaultValue={request.requirementDetails} style={{ padding: '12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }}></textarea>
            </div>
          </div>

          <div style={{ marginTop: "32px", display: "flex", gap: "16px", justifyContent: "flex-end" }}>
            <Link href={`/quotation-requests/${id}`} className="btn-secondary" style={{ padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }}>
              Cancel
            </Link>
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
