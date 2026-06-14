"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, UploadCloud } from "lucide-react";
import styles from "../../projects/new/page.module.css";
import { createQuotation } from "../actions";

export default function QuotationForm({ customers }: { customers: any[] }) {
  const [subtotal, setSubtotal] = useState<string>("");
  const gstPercentage = 18;
  const totalAmount = subtotal ? (parseFloat(subtotal) * (1 + gstPercentage / 100)).toFixed(2) : "0.00";

  return (
    <form action={createQuotation} className={styles.formCard} encType="multipart/form-data">
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Aronium Quotation Details</h2>
        <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px'}}>
          This will link a quotation generated in Aronium POS to a CRM customer.
        </p>
        
        <div className={styles.inputGroup}>
          <label htmlFor="customerId">Select Customer *</label>
          <select id="customerId" name="customerId" required>
            <option value="">-- Choose a Customer --</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.company ? `(${customer.company})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label htmlFor="quotationNumber">Quotation Number *</label>
            <input type="text" id="quotationNumber" name="quotationNumber" required placeholder="e.g. Q-2026-001" autoComplete="off" />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="date">Quotation Date *</label>
            <input type="date" id="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label htmlFor="subtotal">Subtotal (₹) *</label>
            <input 
              type="number" 
              step="0.01" 
              id="subtotal" 
              name="subtotal" 
              required 
              placeholder="0.00" 
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>GST ({gstPercentage}%)</label>
            <input 
              type="text" 
              disabled 
              value={`₹${subtotal ? (parseFloat(subtotal) * (gstPercentage / 100)).toFixed(2) : "0.00"}`} 
              style={{ backgroundColor: "var(--background)", cursor: "not-allowed" }}
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label>Total Amount (₹)</label>
            <input 
              type="text" 
              disabled 
              value={`₹${totalAmount}`} 
              style={{ fontWeight: "bold", backgroundColor: "var(--background)", cursor: "not-allowed" }}
            />
            <input type="hidden" name="totalAmount" value={totalAmount} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="status">Initial Status</label>
            <select id="status" name="status">
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent to Customer</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="notes">Notes / Terms</label>
          <textarea id="notes" name="notes" rows={3} placeholder="Add any specific terms or notes..." />
        </div>
      </div>

      <div className={styles.formSection} style={{marginTop: '24px'}}>
         <h2 className={styles.sectionTitle}><UploadCloud size={18} /> Upload PDF (Optional)</h2>
         <div className={styles.inputGroup}>
            <input type="file" id="pdfFile" name="pdfFile" accept="application/pdf" />
         </div>
      </div>

      <div className={styles.formActions}>
        <Link href="/quotations" className="btn-secondary">Cancel</Link>
        <button type="submit" className="btn-primary">
          <Save size={18} />
          Save Quotation
        </button>
      </div>
    </form>
  );
}
