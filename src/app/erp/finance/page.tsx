export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default async function FinanceDashboard() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    redirect("/");
  }

  const [incomes, expenses] = await Promise.all([
    prisma.erpIncome.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.erpExpense.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const [totalIncomeResult, totalExpenseResult] = await Promise.all([
    prisma.erpIncome.aggregate({
      _sum: { amount: true },
    }),
    prisma.erpExpense.aggregate({
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = totalIncomeResult._sum.amount || 0;
  const totalExpense = totalExpenseResult._sum.amount || 0;
  const balance = totalIncome - totalExpense;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Finance & Accounts</h1>
        <div className={styles.actions}>
          <Link href="/erp/finance/income" className={styles.secondaryButton}>
            View All Income
          </Link>
          <Link href="/erp/finance/expense" className={styles.secondaryButton}>
            View All Expenses
          </Link>
          <Link href="/erp/finance/income/new" className={styles.primaryButton}>
            + Add Income
          </Link>
          <Link href="/erp/finance/expense/new" className={styles.primaryButton}>
            + Add Expense
          </Link>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Total Income</span>
          <span className={`${styles.statValue} ${styles.income}`}>
            ₹{totalIncome.toLocaleString()}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Total Expenses</span>
          <span className={`${styles.statValue} ${styles.expense}`}>
            ₹{totalExpense.toLocaleString()}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Net Balance</span>
          <span className={`${styles.statValue} ${styles.balance}`}>
            ₹{balance.toLocaleString()}
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Recent Income</h2>
        </div>
        {incomes.length === 0 ? (
          <div className={styles.emptyState}>No income records found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Service/Source</th>
                <th>Amount</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id}>
                  <td>{inc.paymentDate.toLocaleDateString()}</td>
                  <td>{inc.category}</td>
                  <td>{inc.service}</td>
                  <td className={styles.income}>₹{inc.amount.toLocaleString()}</td>
                  <td>{inc.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Recent Expenses</h2>
        </div>
        {expenses.length === 0 ? (
          <div className={styles.emptyState}>No expense records found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.paymentDate.toLocaleDateString()}</td>
                  <td>{exp.category}</td>
                  <td>{exp.title}</td>
                  <td className={styles.expense}>₹{exp.amount.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[exp.status.toLowerCase()] || ''}`}>
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
