export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";
import InvoiceRequestForm from "./InvoiceRequestForm";

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
        <InvoiceRequestForm customers={customers} />
      </div>
    </div>
  );
}
