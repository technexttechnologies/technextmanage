import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { Check, Clock, FileText, Download, FileSignature, ArrowLeft } from "lucide-react";
import { formatPdfUrl } from "@/lib/cloudinaryStorage";

export default async function PublicTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // 1. Check if it's a Project
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { customer: true, milestones: true, notes: true }
  });

  if (project) {
    const activityLogs = await prisma.activityLog.findMany({
      where: { entityId: project.id, entityType: "PROJECT" },
      orderBy: { createdAt: "desc" }
    });

    const isCompleted = project.status === "COMPLETED" || project.status === "DEPLOYMENT";
    const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{height: '40px', objectFit: 'contain'}} />
            </div>
            <div className={styles.title}>Live Project Tracking</div>
          </div>

          <div className={styles.body}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Project Name</span>
              <span className={styles.infoValue}>{project.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue} style={{ color: isCompleted ? '#10b981' : '#4f46e5', fontWeight: 'bold' }}>
                {formatStatus(project.status)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Progress</span>
              <span className={styles.infoValue}>
                <div style={{background: '#E5E7EB', borderRadius: '4px', height: '8px', width: '150px', overflow: 'hidden'}}>
                  <div style={{background: '#635BFF', width: `${project.progress}%`, height: '100%'}}></div>
                </div>
                <span style={{fontSize: '12px', marginTop: '4px', display: 'block'}}>{project.progress}% Complete</span>
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Expected Delivery</span>
              <span className={styles.infoValue}>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</span>
            </div>

            <div className={styles.stepper}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', color: '#1e293b' }}>Recent Activity & Updates</h3>
              
              <div className={styles.timeline}>
                {activityLogs.length > 0 ? activityLogs.map((log: any, idx: number) => (
                  <div key={log.id} className={`${styles.step} ${idx === 0 ? styles.active : styles.completed}`}>
                    <div className={styles.stepLine}></div>
                    <div className={styles.stepIcon}>
                      <Check size={16} />
                    </div>
                    <div className={styles.stepContent}>
                      <h4 style={{fontSize: '14px'}}>{log.action}</h4>
                      <p style={{fontSize: '12px'}}>{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Clock size={16} /></div>
                    <div className={styles.stepContent}>
                      <h4>Project Started</h4>
                      <p>Waiting for first update.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Check if it's a Quotation
  let request: any = await prisma.quotationRequest.findUnique({
    where: { id: resolvedParams.id },
    include: { customer: true }
  });
  let type = "Quotation";

  // 3. If not, check if it's an invoice
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
          <div className={styles.logo}>
            <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{height: '40px', objectFit: 'contain'}} />
          </div>
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

          <div className={styles.actionBar}>
            {type === "Quotation" && request.structuredData && (
              <Link href={`/request/quotation/${request.id}`} className={styles.btnPrimary} style={{ textDecoration: 'none' }}>
                <FileSignature size={18} /> View Dynamic Proposal
              </Link>
            )}
            {type === "Invoice" && request.structuredData && (
              <Link href={`/request/invoice/${request.id}`} className={styles.btnPrimary} style={{ textDecoration: 'none' }}>
                <FileSignature size={18} /> View Dynamic Invoice
              </Link>
            )}
            {request.pdfUrl && (
              <a href={formatPdfUrl(request.pdfUrl)} target="_blank" rel="noreferrer" className={styles.btnSecondary} style={{ textDecoration: 'none' }}>
                <Download size={18} /> Download Original Document
              </a>
            )}
            <Link href={`/portal/${request.customer.portalToken}`} className={styles.btnSecondary} style={{ textDecoration: 'none' }}>
              <ArrowLeft size={18} /> Back to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
