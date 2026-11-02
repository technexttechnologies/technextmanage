export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, History, ArrowDownLeft, ArrowUpRight, AlertTriangle, RefreshCw } from "lucide-react";
import styles from "../page.module.css";

export const metadata = {
  title: "Stock Movements & Audit Ledger | TechNext ERP",
  description: "Complete chronological history of all inventory stock adjustments, sales dispatches, and restocks.",
};

export default async function StockMovementsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: true,
      createdBy: true,
    },
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/inventory" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
          <h1 className={styles.title}>Stock Movements & Audit Ledger</h1>
          <p className={styles.subtitle}>
            Chronological audit log of all stock increases, dispatches, damages, and manual count corrections.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} style={{ color: 'var(--brand-accent)' }} />
            Recent Stock Transactions ({movements.length})
          </h3>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product / SKU</th>
                <th>Movement Type</th>
                <th>Qty Change</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Reason / Reference</th>
                <th>Audited By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const isPositive = m.type === "IN";
                return (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <Link href={`/inventory/${m.product.id}`} className={styles.productTitle}>
                        {m.product.name}
                      </Link>
                      {m.product.sku && <div className={styles.productSku}>SKU: {m.product.sku}</div>}
                    </td>
                    <td>
                      <span className={styles.categoryTag} style={{
                        background: m.type === "IN" ? "#DCFCE7" : m.type === "DAMAGE" ? "#FEE2E2" : m.type === "OUT" ? "#EFF6FF" : "#F1F5F9",
                        color: m.type === "IN" ? "#166534" : m.type === "DAMAGE" ? "#991B1B" : m.type === "OUT" ? "#1E40AF" : "#334155",
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {m.type === "IN" && <ArrowDownLeft size={12} />}
                        {m.type === "OUT" && <ArrowUpRight size={12} />}
                        {m.type === "DAMAGE" && <AlertTriangle size={12} />}
                        {m.type === "ADJUSTMENT" && <RefreshCw size={12} />}
                        {m.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: isPositive ? "#16A34A" : "#DC2626" }}>
                      {isPositive ? `+${m.quantity}` : `-${m.quantity}`} {m.product.unit}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {m.previousStock} {m.product.unit}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.newStock} {m.product.unit}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div>{m.reason || "Manual update"}</div>
                      {m.referenceNo && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Ref: {m.referenceNo}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {m.createdBy?.name || "System"}
                    </td>
                  </tr>
                );
              })}

              {movements.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
