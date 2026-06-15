export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Check, FileSignature, Download, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import styles from "./page.module.css";
import { formatPdfUrl } from "@/lib/cloudinaryStorage";
import { QuotationApprovalButtons } from "./QuotationApprovalButtons";

export default async function DynamicQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { id: 'asc' } },
      terms: { orderBy: { order: 'asc' } },
      milestones: { orderBy: { order: 'asc' } },
    }
  });

  if (!quotation) return notFound();

  const crmCompanyInfo = {
    name: "TechNext Technologies",
    address: "pulpally, wayanad, kerala(673579)",
    email: "info.technexttech@gmail.com",
    website: "technexttechnologies.in"
  };

  const whatsappMessage = encodeURIComponent(`Hi! I have some questions regarding Quotation ${quotation.quotationNumber}.`);
  const whatsappUrl = `https://wa.me/919446540984?text=${whatsappMessage}`;

  return (
    <div className={styles.container}>
      <div className={styles.document}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            {/* Replace with actual high-res logo if needed */}
            <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TechNext Technologies" />
            <div className={styles.companyInfo}>
              <p><strong>{crmCompanyInfo.name}</strong></p>
              <p>{crmCompanyInfo.address}</p>
              <p>{crmCompanyInfo.email}</p>
            </div>
          </div>
          <div className={styles.quoteMeta}>
            <h1 className={styles.quoteTitle}>QUOTATION</h1>
            <div className={styles.metaGrid}>
              <div className={styles.metaLabel}>Quote #</div>
              <div className={styles.metaValue}>{quotation.quotationNumber}</div>
              
              <div className={styles.metaLabel}>Issue Date</div>
              <div className={styles.metaValue}>{format(new Date(quotation.date), 'MMM dd, yyyy')}</div>
              
              {quotation.expiryDate && (
                <>
                  <div className={styles.metaLabel}>Valid Until</div>
                  <div className={styles.metaValue}>{format(new Date(quotation.expiryDate), 'MMM dd, yyyy')}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.clientSection}>
            <h3>Prepared For</h3>
            <div className={styles.clientDetails}>
              <p><strong>{quotation.companyName || quotation.customer.company || quotation.customer.name}</strong></p>
              {quotation.companyAddress && <p>{quotation.companyAddress}</p>}
              {quotation.companyGst && <p>GSTIN: {quotation.companyGst}</p>}
              <p>{quotation.customer.name} | {quotation.customer.phone}</p>
              <p>{quotation.customer.email}</p>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Investment Summary</h2>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className={styles.numberCell}>Qty</th>
                  <th className={styles.numberCell}>Unit Price</th>
                  <th className={styles.numberCell}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.length > 0 ? quotation.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className={styles.itemName}>{item.name}</p>
                      {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                    </td>
                    <td className={styles.numberCell}>{item.quantity}</td>
                    <td className={styles.numberCell}>₹{item.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className={styles.numberCell}>₹{item.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>
                      <p className={styles.itemDesc}>Please refer to the attached PDF for a detailed breakdown of services.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>₹{quotation.subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className={styles.totalRow}>
              <span>GST ({quotation.gstPercentage}%)</span>
              <span>₹{(quotation.totalAmount - quotation.subtotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grand}`}>
              <span>Total Amount</span>
              <span>₹{quotation.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div className={styles.grid2}>
            {quotation.milestones.length > 0 && (
              <div>
                <h2 className={styles.sectionTitle}>Project Timeline</h2>
                <ul className={styles.list}>
                  {quotation.milestones.map(ms => (
                    <li key={ms.id} className={styles.listItem}>
                      <Clock size={20} className={styles.listItemIcon} />
                      <div className={styles.listItemContent}>
                        <p><strong>{ms.name}</strong></p>
                        {ms.duration && <p style={{color: '#64748b', fontSize: '13px'}}>{ms.duration}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quotation.terms.length > 0 && (
              <div>
                <h2 className={styles.sectionTitle}>Project Details</h2>
                <ul className={styles.list}>
                  {quotation.terms.map(term => (
                    <li key={term.id} className={styles.listItem}>
                      <CheckCircle2 size={20} className={styles.listItemIcon} />
                      <div className={styles.listItemContent}>
                        <p>{term.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        {quotation.status === "APPROVED" || quotation.status === "CONVERTED" ? (
          <div className={styles.btnPrimary} style={{ background: '#f8fafc', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default' }}>
            <Check size={18} /> Quotation Approved
          </div>
        ) : (
          <QuotationApprovalButtons quotationId={quotation.id} currentStatus={quotation.status} />
        )}

        <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
          <MessageSquare size={18} /> Contact Sales
        </a>

        {quotation.pdfUrl && (
          <a href={formatPdfUrl(quotation.pdfUrl)} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
            <Download size={18} /> Download Original PDF
          </a>
        )}
      </div>
    </div>
  );
}
