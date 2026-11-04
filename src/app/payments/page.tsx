export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { IndianRupee, ShieldAlert, ArrowRight, CheckCircle, Mail, MessageCircle, Download } from "lucide-react";
import styles from "./page.module.css";
import { sendInvoiceReminder } from "../invoice-requests/actions";
import { sendAMCPaymentReminder } from "../amc/actions";
import { getWhatsAppLink, buildPaymentReminderMessage } from "@/lib/whatsapp";

export default async function PaymentsDashboard() {
  const rawInvoices = await prisma.invoiceRequest.findMany({
    where: {
      status: { not: "CANCELLED" }
    },
    include: { customer: true, project: true },
    orderBy: { createdAt: 'desc' }
  });

  const pendingInvoices = rawInvoices.filter(inv => {
    if (inv.status === "DRAFT" || inv.status === "CANCELLED") return false;
    const sData = (inv.structuredData as any) || {};
    const total = Number(sData.totalAmount !== undefined ? sData.totalAmount : inv.amountRequested || 0);
    // Ignore refund documents
    if (total <= 0 || sData.documentType === "REFUND" || inv.aroniumInvoiceNo?.includes("220-")) return false;

    const paidAmount = Number(sData.paidAmount !== undefined ? sData.paidAmount : (inv.status === "PAID" ? total : 0));
    const amountDue = Number(sData.amountDue !== undefined ? sData.amountDue : Math.max(0, total - paidAmount));

    // Exclude if explicitly paid and 0 balance due
    if (inv.status === "PAID" && sData.paymentStatus === "Paid" && amountDue <= 0) {
      return false;
    }

    return amountDue > 0 || inv.status === "PARTIALLY_PAID" || sData.paymentStatus === "Partially Paid" || inv.status !== "PAID";
  });

  const pendingAMCs = await prisma.aMC.findMany({
    where: {
      paymentStatus: "PENDING"
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <IndianRupee size={32} color="var(--brand-primary)" />
            Outstanding Payments
          </h1>
          <p className={styles.subtitle}>Track, download invoice PDFs, and send reminders for unpaid invoices and partial payments.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Outstanding Invoices */}
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <ShieldAlert size={20} color="#EF4444" /> Unpaid &amp; Partial Invoices ({pendingInvoices.length})
          </h2>
          {pendingInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle size={32} color="#10B981" style={{marginBottom: '12px'}} />
              <p>All sent invoices have been fully paid!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice details</th>
                  <th>Client</th>
                  <th>Amount &amp; Balance Due</th>
                  <th>Last Reminder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map(inv => {
                  const sData = (inv.structuredData as any) || {};
                  const total = Number(sData.totalAmount !== undefined ? sData.totalAmount : inv.amountRequested || 0);
                  const paidAmount = Number(sData.paidAmount !== undefined ? sData.paidAmount : (inv.status === "PAID" ? total : 0));
                  const amountDue = Number(sData.amountDue !== undefined ? sData.amountDue : Math.max(0, total - paidAmount));
                  const isPartial = paidAmount > 0 && amountDue > 0;
                  const invoiceDocNumber = sData.documentNumber || inv.aroniumInvoiceNo || `INV-${inv.id.slice(-6).toUpperCase()}`;

                  const portalInvoiceUrl = inv.customer?.portalToken
                    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${inv.customer.portalToken}/invoices/${inv.id}`
                    : `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/request/invoice/${inv.id}`;

                  const whatsappMsg = buildPaymentReminderMessage({
                    customerName: inv.customer.name,
                    invoiceNumber: invoiceDocNumber,
                    totalAmount: total,
                    pendingAmount: amountDue,
                    viewUrl: portalInvoiceUrl
                  });

                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span>{invoiceDocNumber}</span>
                          {isPartial ? (
                            <span className={styles.tagPartial}>Partially Paid</span>
                          ) : (
                            <span className={styles.tagDue}>Unpaid</span>
                          )}
                        </div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{inv.project?.name || 'General'}</div>
                      </td>
                      <td>
                        <div style={{fontWeight: 500}}>{inv.customer.name}</div>
                        {inv.customer.phone && <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>{inv.customer.phone}</div>}
                      </td>
                      <td>
                        <div style={{fontWeight: 700, fontSize: '15px', color: amountDue > 0 ? '#DC2626' : '#166534'}}>
                          ₹{amountDue.toFixed(2)} Due
                        </div>
                        <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px'}}>
                          Total: ₹{total.toFixed(2)} {paidAmount > 0 && `| Paid: ₹${paidAmount.toFixed(2)}`}
                        </div>
                      </td>
                      <td>
                        {inv.lastReminderSentAt ? (
                          <span className={styles.tagWarning}>{new Date(inv.lastReminderSentAt).toLocaleDateString()}</span>
                        ) : (
                          <span className={styles.tag}>Not Sent</span>
                        )}
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap'}}>
                          <form action={async () => {
                            "use server";
                            await sendInvoiceReminder(inv.id);
                          }}>
                            <button type="submit" className={styles.reminderBtn} title="Send Payment Reminder Email">
                              <Mail size={14} /> Email
                            </button>
                          </form>
                          {inv.customer.phone && (
                            <a 
                              href={getWhatsAppLink(inv.customer.phone, whatsappMsg)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={styles.whatsappBtn}
                              title="Send WhatsApp Payment Reminder with pending balance"
                            >
                              <MessageCircle size={14} /> WA
                            </a>
                          )}
                          <a 
                            href={`/billing/doc/invoice/${inv.id}?download=pdf`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={styles.pdfBtn}
                            title="Download Vector PDF Invoice"
                          >
                            <Download size={14} /> PDF
                          </a>
                          <Link href={`/billing/doc/invoice/${inv.id}`} className={styles.actionLink} target="_blank" title="View Official Template">
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
