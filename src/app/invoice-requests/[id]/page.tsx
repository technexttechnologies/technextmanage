export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatPdfUrl } from "@/lib/cloudinaryStorage";
import { ArrowLeft, User, Receipt, CheckCircle, Save, Download, FileSignature, MessageCircle, Bell, Mail } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";
import { updateInvoiceStatus } from "../actions";
import InvoicePdfUploader from "@/components/InvoicePdfUploader";
import { getWhatsAppLink, buildPaymentReminderMessage } from "@/lib/whatsapp";

export default async function InvoiceRequestDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const request = await prisma.invoiceRequest.findUnique({
    where: { id: resolvedParams.id },
    include: {
      customer: true,
      project: true,
      requestedBy: true,
      assignedAdmin: true
    }
  });

  if (!request) return notFound();

  const statuses = [
    "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", 
    "INVOICE_GENERATED", "PDF_UPLOADED", "SENT_TO_CUSTOMER", 
    "PAID", "CANCELLED"
  ];

  return (
    <div className={styles.container}>
      <Link href="/invoice-requests" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', background: 'transparent', border: 'none' }}>
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <header className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className={styles.title}>Invoice Req: #{request.id.slice(-6).toUpperCase()}</h1>
            <span className={`${styles.statusBadge} ${styles[`status_${request.status}`]}`}>
              {request.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className={styles.subtitle}>Requested by {request.requestedBy.name} for {request.customer.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={`/billing/doc/invoice/${request.id}?download=pdf`} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Download Invoice PDF
          </a>
          <Link href={`/billing/doc/invoice/${request.id}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            View Template
          </Link>
        </div>
      </header>

      <div className={styles.detailGrid}>
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.card} style={{ margin: 0 }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <Receipt size={20} /> Request Details
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Customer Name</label>
                <div style={{ padding: '10px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                  <Link href={`/customers/${request.customerId}`}>{request.customer.name}</Link>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Related Project</label>
                <div style={{ padding: '10px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)' }}>
                  {request.project ? <Link href={`/projects/${request.projectId}`}>{request.project.name}</Link> : "General Invoice (No Project)"}
                </div>
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Amount Details</label>
                <div style={{ padding: '16px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                    <span style={{ fontWeight: 500 }}>₹{request.subtotal?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Total Amount:</span>
                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#166534' }}>₹{request.amountRequested.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Invoice Details / Line Items</label>
                <div style={{ padding: '16px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {request.notes}
                </div>
              </div>
              {(() => {
                const sData = request.structuredData as any;
                const itemsList = sData?.items && Array.isArray(sData.items) ? sData.items : null;
                if (!itemsList || itemsList.length === 0) return null;
                return (
                  <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>Itemized Breakdown & Inventory Sync</label>
                      {sData?.stockDeducted && (
                        <span style={{ fontSize: '12px', background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          ✓ Stock Deducted from Inventory
                        </span>
                      )}
                    </div>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-background)', borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px' }}>Item Description</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsList.map((it: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 500 }}>{it.name || it.description}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>{it.quantity || 1}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{Number(it.price || it.unitPrice || 0).toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{Number(it.total || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className={styles.card} style={{ margin: 0, border: '1px solid var(--brand-primary)', background: '#F8FAFC' }}>
              <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--brand-primary)' }}>
                <User size={20} /> Admin Management
              </h2>
              <form action={updateInvoiceStatus}>
                <input type="hidden" name="requestId" value={request.id} />
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>Update Status</label>
                    <select name="status" defaultValue={request.status} required>
                      {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Aronium Invoice Number</label>
                    <input type="text" name="aroniumInvoiceNo" defaultValue={request.aroniumInvoiceNo || ""} placeholder="e.g. INV-2026-001" />
                  </div>
                  <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Admin Notes (Visible to Employee)</label>
                    <textarea name="adminNotes" rows={3} defaultValue={request.adminNotes || ""} placeholder="Add notes regarding this invoice..."></textarea>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <Save size={16} /> Save Admin Updates
                </button>
              </form>
              <div style={{ marginTop: '12px' }}>
                <a 
                  href={getWhatsAppLink(request.customer.phone, `Hello ${request.customer.name}, the status of your Invoice (#${request.id.slice(-6).toUpperCase()}) has been updated to: ${request.status.replace(/_/g, ' ')}.\n\nView live progress: https://technextmanage.vercel.app/track/${request.id}`)}
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#25D366', color: 'white', border: 'none' }}
                >
                  <MessageCircle size={16} /> Send WhatsApp Update
                </a>
              </div>

              {request.status !== "PAID" && request.status !== "DRAFT" && request.status !== "CANCELLED" && (
                <div style={{ marginTop: '12px' }}>
                  {request.customer.phone && (
                    <div style={{ marginBottom: '8px' }}>
                      <a
                        href={getWhatsAppLink(
                          request.customer.phone,
                          buildPaymentReminderMessage({
                            customerName: request.customer.name,
                            invoiceNumber: request.aroniumInvoiceNo || request.id.slice(-6).toUpperCase(),
                            totalAmount: request.amountRequested,
                            pendingAmount: request.amountRequested,
                            viewUrl: `https://technextmanage.vercel.app/track/${request.id}`
                          })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#D97706', color: 'white', border: 'none' }}
                        title="Send 1-Click WhatsApp Payment Reminder"
                      >
                        <Bell size={16} /> Send WhatsApp Payment Reminder
                      </a>
                    </div>
                  )}
                  <form action={async () => {
                    "use server";
                    const { sendInvoiceReminder } = await import('../actions');
                    await sendInvoiceReminder(request.id);
                  }}>
                    <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#0284C7', color: 'white', border: 'none' }}>
                      <Mail size={16} /> Send Payment Reminder Email
                    </button>
                  </form>
                  {request.lastReminderSentAt && (
                    <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '4px', color: 'var(--text-muted)' }}>
                      Last reminder sent: {new Date(request.lastReminderSentAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <hr style={{ margin: '24px 0', borderTop: '1px solid var(--surface-border)' }} />
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Upload Invoice PDF</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Generate the Invoice in Aronium and upload it here.</p>
              <InvoicePdfUploader requestId={request.id} />
              
              <hr style={{ margin: '24px 0', borderTop: '1px solid var(--surface-border)' }} />
              <form action={async (formData) => {
                "use server";
                const { deleteInvoiceRequest } = await import('../actions');
                await deleteInvoiceRequest(formData);
              }}>
                <input type="hidden" name="requestId" value={request.id} />
                <button type="submit" className="btn-secondary" style={{ width: '100%', color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}>
                  Delete Invoice Request
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Workflow Tracker */}
        <div>
          <div className={styles.card}>
            <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <FileSignature size={18} /> Workflow Progress
            </h2>
            <div className={styles.stepper}>
              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}><CheckCircle size={14} /></div>
                <div className={styles.stepContent}>
                  <h4>Request Submitted</h4>
                  <p>By {request.requestedBy.name}</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.status !== "SUBMITTED" && request.status !== "DRAFT" ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.status !== "SUBMITTED" && request.status !== "DRAFT" ? <CheckCircle size={14} /> : "2"}</div>
                <div className={styles.stepContent}>
                  <h4>Under Review</h4>
                  <p>Admin reviewing details</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.aroniumInvoiceNo ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.aroniumInvoiceNo ? <CheckCircle size={14} /> : "3"}</div>
                <div className={styles.stepContent}>
                  <h4>Invoice Generated</h4>
                  <p>{request.aroniumInvoiceNo ? `Ref: ${request.aroniumInvoiceNo}` : 'Pending in Aronium'}</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.pdfUrl ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.pdfUrl ? <CheckCircle size={14} /> : "4"}</div>
                <div className={styles.stepContent}>
                  <h4>PDF Uploaded</h4>
                  <p>{request.pdfUrl ? 'Available in Cloud' : 'Waiting for upload'}</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.status === "SENT_TO_CUSTOMER" || request.status === "PAID" ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.status === "SENT_TO_CUSTOMER" || request.status === "PAID" ? <CheckCircle size={14} /> : "5"}</div>
                <div className={styles.stepContent}>
                  <h4>Sent to Customer</h4>
                  <p>Awaiting payment</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.status === "PAID" ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.status === "PAID" ? <CheckCircle size={14} /> : "6"}</div>
                <div className={styles.stepContent}>
                  <h4>Invoice Paid</h4>
                  <p>Transaction Complete</p>
                </div>
              </div>
            </div>
            
            {request.adminNotes && (
              <div style={{ marginTop: '32px', padding: '16px', background: '#FEF3C7', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #F59E0B' }}>
                <h4 style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>Admin Note</h4>
                <p style={{ fontSize: '14px', color: '#B45309' }}>{request.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
