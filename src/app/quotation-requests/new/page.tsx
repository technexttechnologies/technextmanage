export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ArrowLeft, Save } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";
import { createQuotationRequest } from "../actions";

export default async function NewQuotationRequestPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true }
  });

  return (
    <div className={styles.container}>
      <Link href="/quotation-requests" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', background: 'transparent', border: 'none' }}>
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New Quotation Request</h1>
          <p className={styles.subtitle}>Submit a request to the admin team to generate a quotation.</p>
        </div>
      </header>

      <div className={styles.card}>
        <form action={createQuotationRequest}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="customerId">Select Customer *</label>
              <select id="customerId" name="customerId" required>
                <option value="">-- Choose a Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="serviceName">Service / Product Name *</label>
              <input type="text" id="serviceName" name="serviceName" required placeholder="e.g. Complete Website Redesign" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="budget">Customer Budget (Optional)</label>
              <input type="text" id="budget" name="budget" placeholder="e.g. ₹50,000" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="priority">Priority Level *</label>
              <select id="priority" name="priority" required defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="requirementDetails">Requirement Details *</label>
              <textarea 
                id="requirementDetails" 
                name="requirementDetails" 
                rows={6} 
                required 
                placeholder="List all modules, features, and specific requirements the customer asked for..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--surface-border)', paddingTop: '24px' }}>
            <Link href="/quotation-requests" className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
