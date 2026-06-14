export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../projects/new/page.module.css";
import QuotationForm from "./QuotationForm";

export default async function NewQuotationPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/quotations" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create Quotation Reference</h1>
      </header>

      <QuotationForm customers={customers} />
    </div>
  );
}
