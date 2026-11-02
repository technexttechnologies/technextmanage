export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Receipt, Plus, FileText, ClipboardList } from "lucide-react";
import styles from "./page.module.css";
import BillingDashboardClient from "./BillingDashboardClient";

export default async function BillingHubPage() {
  const [invoices, quotations] = await Promise.all([
    prisma.invoiceRequest.findMany({
      include: {
        customer: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quotation.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })
  ]);

  // Financial Metrics
  const totalBilled = invoices.reduce((sum, inv) => {
    const sData = (inv.structuredData as any) || {};
    return sum + (sData.totalAmount || inv.amountRequested || 0);
  }, 0);

  const totalCollected = invoices.reduce((sum, inv) => {
    const sData = (inv.structuredData as any) || {};
    const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
    return sum + (isPaid ? (sData.paidAmount || sData.totalAmount || inv.amountRequested || 0) : 0);
  }, 0);

  const totalDue = Math.max(0, totalBilled - totalCollected);

  const activeQuotes = quotations.filter(
    q => q.status !== "REJECTED" && q.status !== "CONVERTED"
  ).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Receipt size={32} color="#4F46E5" />
            Billing &amp; Invoicing Suite
          </h1>
          <p className={styles.subtitle}>
            Enterprise billing software for generating official Invoices, Order Forms, Quotations, and Payment Receipts matching the Aronium bill template.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link 
            href="/billing/new?type=invoice" 
            className="btn-primary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} /> New Invoice Bill
          </Link>
          <Link 
            href="/billing/new?type=quotation" 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <FileText size={16} /> New Quotation
          </Link>
          <Link 
            href="/billing/new?type=order" 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <ClipboardList size={16} /> New Order Form
          </Link>
        </div>
      </header>

      <BillingDashboardClient 
        invoices={invoices} 
        quotations={quotations} 
        metrics={{ totalBilled, totalCollected, totalDue, activeQuotes }} 
      />
    </div>
  );
}
