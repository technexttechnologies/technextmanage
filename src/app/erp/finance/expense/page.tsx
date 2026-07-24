export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "../page.module.css";
import StatusDropdown from "./StatusDropdown";
import ReportExportHeader from "@/components/erp/ReportExportHeader";
import DeleteButton from "../DeleteButton";
import SyncAroniumButton from "../SyncAroniumButton";

export default async function ExpensePage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    redirect("/");
  }

  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session.role as string);

  const expenses = await prisma.erpExpense.findMany({
    orderBy: { paymentDate: "desc" },
    include: {
      recordedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    }
  });

  const exportColumns = ["Date", "Title", "Category", "Vendor", "Amount", "Recorded By", "Status"];
  const exportData = expenses.map(exp => [
    exp.paymentDate.toLocaleDateString(),
    exp.title,
    exp.category,
    exp.vendor || "-",
    exp.amount.toString(),
    exp.recordedBy?.name || "-",
    exp.status
  ]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Expense Ledger</h1>
          <p className={styles.subtitle}>Track all outgoing payments and purchases</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SyncAroniumButton />
          <Link href="/erp/finance/expense/new" className={styles.primaryButton}>
            <Plus size={18} /> Record Expense
          </Link>
        </div>
      </header>

      <ReportExportHeader 
        title="Expense Report"
        subtitle="Business expense records"
        columns={exportColumns}
        data={exportData}
      />

      <div className={styles.tableContainer}>
        {expenses.length === 0 ? (
          <div className={styles.emptyState}>No expense records found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Recorded By</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.paymentDate.toLocaleDateString()}</td>
                  <td>{exp.title}</td>
                  <td>{exp.category}</td>
                  <td>{exp.vendor || "-"}</td>
                  <td className={styles.expense}>₹{exp.amount.toLocaleString()}</td>
                  <td>{exp.recordedBy?.name || "-"}</td>
                  <td>
                    <StatusDropdown id={exp.id} currentStatus={exp.status} isAdmin={isAdmin} />
                  </td>
                  {isAdmin && (
                    <td>
                      <DeleteButton id={exp.id} type="expense" />
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
