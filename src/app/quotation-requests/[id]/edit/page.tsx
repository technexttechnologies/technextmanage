import { prisma } from "@/lib/prisma";
import { updateQuotationRequest } from "../../actions";
import Link from "next/link";
import styles from "../../page.module.css";
import { notFound } from "next/navigation";

export default async function EditQuotationRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.quotationRequest.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!request) return notFound();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Quotation Request</h1>
          <p className={styles.subtitle}>Update request details for {request.customer.name}.</p>
        </div>
      </header>

      <form action={updateQuotationRequest} className={styles.formContainer}>
        <input type="hidden" name="id" value={request.id} />

        <div className={styles.formGroup}>
          <label>Service Name</label>
          <input type="text" name="serviceName" required defaultValue={request.serviceName} />
        </div>

        <div className={styles.formGroup}>
          <label>Requirement Details</label>
          <textarea name="requirementDetails" rows={5} required defaultValue={request.requirementDetails}></textarea>
        </div>

        <div className={styles.formGroup}>
          <label>Budget (Optional)</label>
          <input type="text" name="budget" defaultValue={request.budget || ""} />
        </div>

        <div className={styles.formGroup}>
          <label>Priority</label>
          <select name="priority" defaultValue={request.priority}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          <button type="submit" className="btn-primary">Update Request</button>
          <Link href={`/quotation-requests/${request.id}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
