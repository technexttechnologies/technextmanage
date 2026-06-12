import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { Check, Clock, FileText, Download } from "lucide-react";

export default async function PublicTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Check if it's a quotation
  let request: any = await prisma.quotationRequest.findUnique({
    where: { id: resolvedParams.id },
    include: { customer: true }
  });
  let type = "Quotation";

  // If not, check if it's an invoice
  if (!request) {
    request = await prisma.invoiceRequest.findUnique({
      where: { id: resolvedParams.id },
      include: { customer: true }
    });
    type = "Invoice";
  }

  if (!request) return notFound();

  const isCompleted = type === "Quotation" 
    ? (request.status === "SENT_TO_CUSTOMER" || request.status === "ACCEPTED" || request.status === "PDF_UPLOADED")
    : (request.status === "SENT_TO_CUSTOMER" || request.status === "PAID" || request.status === "PDF_UPLOADED");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>TechNext Technologies</div>
          <div className={styles.title}>{type} Request Tracking</div>
        </div>

        <div className={styles.body}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tracking ID</span>
            <span className={styles.infoValue}>#{request.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Customer</span>
            <span className={styles.infoValue}>{request.customer.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Date Requested</span>
            <span className={styles.infoValue}>{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Current Status</span>
            <span className={styles.infoValue} style={{ color: isCompleted ? '#10b981' : '#4f46e5' }}>
              {request.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className={styles.stepper}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', color: '#1e293b' }}>Request Progress</h3>
            
            <div className={`${styles.step} ${styles.completed}`}>
              <div className={styles.stepLine}></div>
              <div className={styles.stepIcon}><Check size={16} /></div>
              <div className={styles.stepContent}>
                <h4>Request Received</h4>
                <p>We have successfully received your request.</p>
              </div>
            </div>

            <div className={`${styles.step} ${request.status !== "DRAFT" && request.status !== "SUBMITTED" ? styles.completed : styles.active}`}>
              <div className={styles.stepLine}></div>
              <div className={styles.stepIcon}>
                {request.status !== "DRAFT" && request.status !== "SUBMITTED" ? <Check size={16} /> : <Clock size={16} />}
              </div>
              <div className={styles.stepContent}>
                <h4>Under Processing</h4>
                <p>Our team is preparing your official document.</p>
              </div>
            </div>

            <div className={`${styles.step} ${isCompleted ? styles.completed : ""}`}>
              <div className={styles.stepIcon}>
                {isCompleted ? <Check size={16} /> : <FileText size={16} />}
              </div>
              <div className={styles.stepContent}>
                <h4>Document Ready</h4>
                <p>Your document has been finalized.</p>
              </div>
            </div>
          </div>

          {request.pdfUrl && (
            <div className={styles.downloadBox}>
              <h4 style={{ color: '#166534', marginBottom: '4px' }}>Your Official Document is Ready!</h4>
              <p style={{ color: '#15803d', fontSize: '14px' }}>You can download it securely using the button below.</p>
              <a href={request.pdfUrl} target="_blank" rel="noreferrer" className={styles.downloadBtn}>
                <Download size={18} /> Download {type}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
