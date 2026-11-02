export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import styles from "../page.module.css";
import BillingDocumentForm from "./BillingDocumentForm";

export default async function NewBillingDocumentPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string; customerId?: string; projectId?: string }>;
}) {
  const { type = "invoice", customerId, projectId } = await searchParams;

  const [customers, products, allProjects] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { projects: true }
    }),
    prisma.erpProduct.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: { 
        id: true, 
        name: true, 
        status: true, 
        customerId: true, 
        type: true, 
        estimatedBudget: true, 
        customer: { select: { id: true, name: true } } 
      }
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
          allProjects={allProjects}
          defaultType={type}
          defaultCustomerId={customerId}
          defaultProjectId={projectId}
        />
      </div>
    </div>
  );
}
