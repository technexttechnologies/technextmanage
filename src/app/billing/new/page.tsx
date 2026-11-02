export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import styles from "../page.module.css";
import BillingDocumentForm from "./BillingDocumentForm";

export default async function NewBillingDocumentPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string; customerId?: string }>;
}) {
  const { type = "invoice", customerId } = await searchParams;

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { projects: true }
    }),
    prisma.erpProduct.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className={styles.container}>
      <Link 
        href="/billing" 
        className="btn-secondary" 
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "6px 12px", background: "transparent", border: "none" }}
      >
        <ArrowLeft size={16} /> Back to Billing Hub
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Receipt size={28} color="#4F46E5" />
            Generate Billing Document
          </h1>
          <p className={styles.subtitle}>
            Create official Invoices, Order Forms, Quotations, and Payment Receipts matching the Aronium bill template.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <BillingDocumentForm 
          customers={customers} 
          products={products}
          defaultType={type}
          defaultCustomerId={customerId}
        />
      </div>
    </div>
  );
}
