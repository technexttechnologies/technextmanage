export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ArrowLeft, Save } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";
import { createInvoiceRequest } from "../actions";

export default async function NewInvoiceRequestPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { projects: true }
  });

  return (
    <div className={styles.container}>
      <Link href="/invoice-requests" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', background: 'transparent', border: 'none' }}>
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New Invoice Request</h1>
          <p className={styles.subtitle}>Submit a request to the admin team to generate an official invoice in Aronium.</p>
        </div>
      </header>

      <div className={styles.card}>
        <form action={createInvoiceRequest}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
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
              <label htmlFor="projectId">Related Project (Optional)</label>
              <select id="projectId" name="projectId">
                <option value="">-- General Invoice (No Project) --</option>
                {customers.flatMap(c => c.projects).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="amountRequested">Invoice Amount (₹) *</label>
              <input type="number" step="0.01" id="amountRequested" name="amountRequested" required placeholder="e.g. 1500.00" />
            </div>

            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="notes">Invoice Details & Line Items *</label>
              <textarea 
                id="notes" 
                name="notes" 
                rows={5} 
                required 
                placeholder="List exactly what should be on the invoice. E.g. '1x Web Development - ₹80000, 1x Hosting - ₹40000'"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--surface-border)', paddingTop: '24px' }}>
            <Link href="/invoice-requests" className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
