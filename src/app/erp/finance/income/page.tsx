export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";
import ReportExportHeader from "@/components/erp/ReportExportHeader";
import DeleteButton from "../DeleteButton";

export default async function IncomePage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    redirect("/");
  }
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session.role as string);

  const incomes = await prisma.erpIncome.findMany({
    orderBy: { date: "desc" },
    include: {
      recordedBy: { select: { name: true } },
    }
  });

  const exportColumns = ["Receipt ID", "Date", "Category", "Method", "Amount", "Recorded By", "Sync ID"];
  const exportData = incomes.map(inc => [
    inc.incomeId,
    inc.date.toLocaleDateString(),
    inc.category,
    inc.paymentMethod,
    inc.amount.toString(),
    inc.recordedBy?.name || "-",
    inc.aroniumId || "-"
  ]);

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

      <ReportExportHeader 
        title="Income Report"
        subtitle="Daily ledger income records"
        columns={exportColumns}
        data={exportData}
      />

      <div className={styles.tableContainer}>
        {incomes.length === 0 ? (
          <div className={styles.emptyState}>No income records found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Recorded By</th>
                <th>Sync ID</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id}>
                  <td>{inc.incomeId}</td>
                  <td>{inc.date.toLocaleDateString()}</td>
                  <td>{inc.category}</td>
                  <td>{inc.paymentMethod}</td>
                  <td className={styles.income}>₹{inc.amount.toLocaleString()}</td>
                  <td>{inc.recordedBy?.name || "-"}</td>
                  <td>{inc.aroniumId || "-"}</td>
                  {isAdmin && (
                    <td>
                      <DeleteButton id={inc.id} type="income" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
