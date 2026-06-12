import { createAroniumRef } from "../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import styles from "../../renewals/new/page.module.css";

export default async function NewAroniumRefPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/aronium" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Link Aronium Document</h1>
      </header>

      <form action={createAroniumRef} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Document Details</h2>
          
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
              <label htmlFor="refType">Document Type *</label>
              <select id="refType" name="refType" required>
                <option value="Invoice">Invoice</option>
                <option value="Quotation">Quotation</option>
                <option value="Payment">Payment Receipt</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="refNumber">Document Number *</label>
              <input type="text" id="refNumber" name="refNumber" required placeholder="e.g. INV-2026-001" autoComplete="off" />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="notes">Amount / Notes</label>
            <textarea id="notes" name="notes" rows={3} placeholder="Add amount or any relevant notes about this document..." />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/aronium" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <LinkIcon size={18} />
            Link Document
          </button>
        </div>
      </form>
    </div>
  );
}
