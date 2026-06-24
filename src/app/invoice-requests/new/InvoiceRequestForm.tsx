"use client";

import { useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import styles from "../page.module.css";
import { createInvoiceRequest } from "../actions";

export default function InvoiceRequestForm({ customers }: { customers: any[] }) {
  const [subtotal, setSubtotal] = useState<string>("");
  const gstPercentage = 0;
  const totalAmount = subtotal ? parseFloat(subtotal).toFixed(2) : "0.00";

  return (
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
          <label htmlFor="subtotal">Subtotal (₹) *</label>
          <input 
            type="number" 
            step="0.01" 
            id="subtotal" 
            name="subtotal" 
            required 
            placeholder="e.g. 1000.00"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
          />
        </div>

          {/* GST Calculation Removed */}

        <div className={styles.inputGroup}>
          <label>Total Amount (₹)</label>
          <input 
            type="text" 
            disabled 
            value={`₹${totalAmount}`} 
            style={{ fontWeight: "bold", backgroundColor: "var(--background)", cursor: "not-allowed" }}
          />
          <input type="hidden" name="amountRequested" value={totalAmount} />
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
  );
}
