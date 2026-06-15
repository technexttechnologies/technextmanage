export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Download, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import styles from "@/app/quotation/[id]/page.module.css";
import { formatPdfUrl } from "@/lib/cloudinaryStorage";
import { InvoiceRequestActionButtons } from "./InvoiceRequestActionButtons";

export default async function DynamicInvoiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const request = await prisma.invoiceRequest.findUnique({
    where: { id },
    include: {
      customer: true,
    }
  });

  if (!request || !request.structuredData) return notFound();

  const data: any = request.structuredData;

  const crmCompanyInfo = {
    name: "TechNext Technologies",
    address: "pulpally, wayanad, kerala(673579)",
    email: "info.technexttech@gmail.com",
    website: "technexttechnologies.in"
  };

  const whatsappMessage = encodeURIComponent(`Hi! I have some questions regarding Invoice ${request.aroniumInvoiceNo || request.id.slice(-6)}.`);
  const whatsappUrl = `https://wa.me/919446540984?text=${whatsappMessage}`;

  return (
    <div className={styles.container}>
      <div className={styles.document}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TechNext Technologies" />
            <div className={styles.companyInfo}>
              <p><strong>{crmCompanyInfo.name}</strong></p>
              <p>{crmCompanyInfo.address}</p>
              <p>{crmCompanyInfo.email}</p>
            </div>
          </div>
          <div className={styles.quoteMeta}>
            <h1 className={styles.quoteTitle}>INVOICE</h1>
            <div className={styles.metaGrid}>
              <div className={styles.metaLabel}>Invoice #</div>
              <div className={styles.metaValue}>{request.aroniumInvoiceNo || `INV-${request.id.slice(-6).toUpperCase()}`}</div>
              
              <div className={styles.metaLabel}>Date</div>
              <div className={styles.metaValue}>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</div>
              
              {data.expiryDate && (
                <>
                  <div className={styles.metaLabel}>Due Date</div>
                  <div className={styles.metaValue}>{format(new Date(data.expiryDate), 'MMM dd, yyyy')}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.clientSection}>
            <h3>Billed To</h3>
            <div className={styles.clientDetails}>
              <p><strong>{data.companyName || request.customer.company || request.customer.name}</strong></p>
              {data.companyAddress && <p>{data.companyAddress}</p>}
              {data.companyGst && <p>GSTIN: {data.companyGst}</p>}
              <p>{request.customer.name} | {request.customer.phone}</p>
              <p>{request.customer.email}</p>
            </div>
          </div>

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
                {data.items && data.items.length > 0 ? data.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <p className={styles.itemName}>{item.name}</p>
                      {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                    </td>
                    <td className={styles.numberCell}>{item.quantity}</td>
                    <td className={styles.numberCell}>₹{Number(item.price).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className={styles.numberCell}>₹{Number(item.total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
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
              <span>₹{Number(data.subtotal || request.subtotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className={styles.totalRow}>
              <span>GST ({data.gstPercentage || request.gstPercentage || 18}%)</span>
              <span>₹{(Number(data.totalAmount || request.amountRequested || 0) - Number(data.subtotal || request.subtotal || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grand}`}>
              <span>Total Due</span>
              <span>₹{Number(data.totalAmount || request.amountRequested || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div className={styles.grid2}>
            {data.terms && data.terms.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <h2 className={styles.sectionTitle}>Project Details</h2>
                <ul className={styles.list}>
                  {data.terms.map((term: any, idx: number) => (
                    <li key={idx} className={styles.listItem}>
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
        <InvoiceRequestActionButtons requestId={request.id} currentStatus={request.status} />

        <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
          <MessageSquare size={18} /> Support
        </a>

        {request.pdfUrl && (
          <a href={formatPdfUrl(request.pdfUrl)} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
            <Download size={18} /> Download Original PDF
          </a>
        )}
      </div>
    </div>
  );
}
