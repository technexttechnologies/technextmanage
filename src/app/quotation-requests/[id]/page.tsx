export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ArrowLeft, User, FileText, CheckCircle, Save, Download, FileSignature } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";
import { updateQuotationStatus } from "../actions";
import QuotationPdfUploader from "@/components/QuotationPdfUploader";

export default async function QuotationRequestDetails({ params }: { params: { id: string } }) {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const request = await prisma.quotationRequest.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      requestedBy: true,
      assignedAdmin: true
    }
  });

  if (!request) return notFound();

  const statuses = [
    "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", 
    "QUOTATION_GENERATED", "PDF_UPLOADED", "SENT_TO_CUSTOMER", 
    "ACCEPTED", "REJECTED"
  ];

  return (
    <div className={styles.container}>
      <Link href="/quotation-requests" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', background: 'transparent', border: 'none' }}>
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <header className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className={styles.title}>Quote Req: #{request.id.slice(-6).toUpperCase()}</h1>
            <span className={`${styles.statusBadge} ${styles[`status_${request.status}`]}`}>
              {request.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className={styles.subtitle}>Requested by {request.requestedBy.name} for {request.customer.name}</p>
        </div>
        {request.pdfUrl && (
          <a href={request.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Download Official Quotation
          </a>
        )}
      </header>

      <div className={styles.detailGrid}>
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.card} style={{ margin: 0 }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <FileText size={20} /> Request Details
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Customer Name</label>
                <div style={{ padding: '10px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                  <Link href={`/customers/${request.customerId}`}>{request.customer.name}</Link>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Customer Company</label>
                <div style={{ padding: '10px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)' }}>
                  {request.customer.company || "N/A"}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Service / Product</label>
                <div style={{ padding: '10px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                  {request.serviceName}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Priority & Budget</label>
                <div style={{ padding: '10px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)' }}>
                  <span className={styles[`priority_${request.priority}`]}>{request.priority}</span> • {request.budget || "No budget specified"}
                </div>
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Requirement Details</label>
                <div style={{ padding: '16px', background: 'var(--surface-background)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {request.requirementDetails}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className={styles.card} style={{ margin: 0, border: '1px solid var(--brand-primary)', background: '#F8FAFC' }}>
              <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--brand-primary)' }}>
                <User size={20} /> Admin Management
              </h2>
              <form action={updateQuotationStatus}>
                <input type="hidden" name="requestId" value={request.id} />
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>Update Status</label>
                    <select name="status" defaultValue={request.status} required>
                      {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Aronium Quotation Number</label>
                    <input type="text" name="aroniumQuotationNo" defaultValue={request.aroniumQuotationNo || ""} placeholder="e.g. Q-2026-001" />
                  </div>
                  <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Admin Notes (Visible to Employee)</label>
                    <textarea name="adminNotes" rows={3} defaultValue={request.adminNotes || ""} placeholder="Add notes regarding this quotation..."></textarea>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <Save size={16} /> Save Admin Updates
                </button>
              </form>

              <hr style={{ margin: '24px 0', borderTop: '1px solid var(--surface-border)' }} />
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Upload PDF to Cloud</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Generate the PDF in Aronium and upload it here.</p>
              <QuotationPdfUploader requestId={request.id} />
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
                  <p>Admin checking requirements</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.aroniumQuotationNo ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.aroniumQuotationNo ? <CheckCircle size={14} /> : "3"}</div>
                <div className={styles.stepContent}>
                  <h4>Quotation Generated</h4>
                  <p>{request.aroniumQuotationNo ? `Ref: ${request.aroniumQuotationNo}` : 'Pending in Aronium'}</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.pdfUrl ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.pdfUrl ? <CheckCircle size={14} /> : "4"}</div>
                <div className={styles.stepContent}>
                  <h4>PDF Uploaded</h4>
                  <p>{request.pdfUrl ? 'Available in Cloud' : 'Waiting for upload'}</p>
                </div>
              </div>
              <div className={`${styles.step} ${request.status === "SENT_TO_CUSTOMER" || request.status === "ACCEPTED" ? styles.completed : ""}`}>
                <div className={styles.stepIcon}>{request.status === "SENT_TO_CUSTOMER" || request.status === "ACCEPTED" ? <CheckCircle size={14} /> : "5"}</div>
                <div className={styles.stepContent}>
                  <h4>Sent to Customer</h4>
                  <p>Awaiting response</p>
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
