export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Receipt, Plus, Search, Calendar } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InvoiceRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  const requests = await prisma.invoiceRequest.findMany({
    where: isAdmin ? {} : { requestedById: session.userId as string },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      project: true,
      requestedBy: true,
      assignedAdmin: true
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoice Requests</h1>
          <p className={styles.subtitle}>
            {isAdmin ? "Manage and generate invoices requested by employees." : "Request new invoices for your customers."}
          </p>
        </div>
        <Link href="/invoice-requests/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Request Invoice
        </Link>
      </header>

      <div className={styles.card}>
        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <Receipt size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3>No Invoice Requests Found</h3>
            <p>Click "Request Invoice" to create your first invoice request.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Customer / Project</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      #{req.id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <Link href={`/customers/${req.customerId}`} style={{ fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                        {req.customer.name}
                      </Link>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {req.project ? `Project: ${req.project.name}` : "General Invoice"}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${req.amountRequested.toFixed(2)}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${req.status}`]}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <Calendar size={14} />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/invoice-requests/${req.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
