export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";

export default async function IncomePage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    redirect("/");
  }

  const incomes = await prisma.erpIncome.findMany({
    orderBy: { paymentDate: "desc" },
    include: {
      recordedBy: { select: { name: true } },
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Income Records</h1>
        <div className={styles.actions}>
          <Link href="/erp/finance" className={styles.secondaryButton}>
            Back to Dashboard
          </Link>
          <Link href="/erp/finance/income/new" className={styles.primaryButton}>
            + Add Income
          </Link>
        </div>
      </header>

      <div className={styles.tableContainer}>
        {incomes.length === 0 ? (
          <div className={styles.emptyState}>No income records found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Date</th>
                <th>Customer / Source</th>
                <th>Service</th>
                <th>Category</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id}>
                  <td>{inc.incomeId}</td>
                  <td>{inc.paymentDate.toLocaleDateString()}</td>
                  <td>{inc.customerName || "-"}</td>
                  <td>{inc.service}</td>
                  <td>{inc.category}</td>
                  <td>{inc.paymentMethod}</td>
                  <td className={styles.income}>₹{inc.amount.toLocaleString()}</td>
                  <td>{inc.recordedBy?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
