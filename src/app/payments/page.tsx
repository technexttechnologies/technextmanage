export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { IndianRupee, ShieldAlert, ArrowRight, CheckCircle, Mail, MessageCircle } from "lucide-react";
import styles from "./page.module.css";
import { sendInvoiceReminder } from "../invoice-requests/actions";
import { sendAMCPaymentReminder } from "../amc/actions";

export default async function PaymentsDashboard() {
  const pendingInvoices = await prisma.invoiceRequest.findMany({
    where: {
      status: { notIn: ["PAID", "CANCELLED", "DRAFT"] }
    },
    include: { customer: true, project: true },
    orderBy: { createdAt: 'desc' }
  });

  const pendingAMCs = await prisma.aMC.findMany({
    where: {
      paymentStatus: "PENDING"
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });

  const getWhatsAppLink = (phone: string, text: string) => {
    return `https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <IndianRupee size={32} color="var(--brand-primary)" />
            Outstanding Payments
          </h1>
          <p className={styles.subtitle}>Track and send reminders for unpaid invoices and AMCs.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Outstanding Invoices */}
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <ShieldAlert size={20} color="#EF4444" /> Unpaid Invoices
          </h2>
          {pendingInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle size={32} color="#10B981" style={{marginBottom: '12px'}} />
              <p>All sent invoices have been paid!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice details</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Last Reminder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map(inv => {
                  const whatsappMsg = `Hello ${inv.customer.name}, this is a gentle reminder regarding your pending invoice for ₹${inv.amountRequested.toFixed(2)}. You can view and pay it here: https://technextmanage.vercel.app/track/${inv.id}`;
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{fontWeight: 500}}>{inv.aroniumInvoiceNo || 'Generated Invoice'}</div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{inv.project?.name || 'General'}</div>
                      </td>
                      <td>{inv.customer.name}</td>
                      <td style={{fontWeight: 600}}>₹{inv.amountRequested.toFixed(2)}</td>
                      <td>
                        {inv.lastReminderSentAt ? (
                          <span className={styles.tagWarning}>{new Date(inv.lastReminderSentAt).toLocaleDateString()}</span>
                        ) : (
                          <span className={styles.tag}>Not Sent</span>
                        )}
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                          <form action={async () => {
                            "use server";
                            await sendInvoiceReminder(inv.id);
                          }}>
                            <button type="submit" className={styles.reminderBtn}>
                              <Mail size={14} /> Email
                            </button>
                          </form>
                          {inv.customer.phone && (
                            <a href={getWhatsAppLink(inv.customer.phone, whatsappMsg)} target="_blank" rel="noreferrer" className={styles.whatsappBtn}>
                              <MessageCircle size={14} /> WA
                            </a>
                          )}
                          <Link href={`/invoice-requests/${inv.id}`} className={styles.actionLink} style={{marginLeft: '8px'}}>
                            View <ArrowRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Outstanding AMCs */}
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <ShieldAlert size={20} color="#F59E0B" /> Pending AMC Payments
          </h2>
          {pendingAMCs.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle size={32} color="#10B981" style={{marginBottom: '12px'}} />
              <p>All AMCs have been paid!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>AMC details</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Last Reminder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAMCs.map(amc => {
                  const amcNumber = `AMC-${new Date(amc.createdAt).getFullYear()}-${amc.amcNumber}`;
                  const whatsappMsg = `Hello ${amc.customer.name}, this is a gentle reminder regarding your pending Annual Maintenance Contract (${amcNumber}) payment for ₹${amc.amount.toFixed(2)}. Please arrange for payment at your earliest convenience.`;
                  return (
                    <tr key={amc.id}>
                      <td>
                        <div style={{fontWeight: 500}}>{amc.title}</div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{amcNumber}</div>
                      </td>
                      <td>{amc.customer.name}</td>
                      <td style={{fontWeight: 600}}>₹{amc.amount.toFixed(2)}</td>
                      <td>
                        {amc.lastReminderSentAt ? (
                          <span className={styles.tagWarning}>{new Date(amc.lastReminderSentAt).toLocaleDateString()}</span>
                        ) : (
                          <span className={styles.tag}>Not Sent</span>
                        )}
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                          <form action={async () => {
                            "use server";
                            await sendAMCPaymentReminder(amc.id);
                          }}>
                            <button type="submit" className={styles.reminderBtn}>
                              <Mail size={14} /> Email
                            </button>
                          </form>
                          {amc.customer.phone && (
                            <a href={getWhatsAppLink(amc.customer.phone, whatsappMsg)} target="_blank" rel="noreferrer" className={styles.whatsappBtn}>
                              <MessageCircle size={14} /> WA
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
