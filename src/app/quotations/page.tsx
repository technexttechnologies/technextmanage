import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, FileSignature, CheckCircle, XCircle, ArrowRightCircle, Download } from "lucide-react";
import styles from "./page.module.css";
import { updateQuotationStatus } from "./actions";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const currentStatus = (await searchParams).status || "ALL";

  const quotations = await prisma.quotation.findMany({
    where: currentStatus === "ALL" ? {} : { status: currentStatus },
    include: {
      customer: true
    },
    orderBy: { date: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Quotation Management</h1>
          <p className={styles.subtitle}>Track and manage Aronium POS quotations within the CRM.</p>
        </div>
        <Link href="/quotations/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add Quotation Ref</span>
        </Link>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search quotation number..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          <Link href="/quotations?status=ALL" className={`${styles.filterTab} ${currentStatus === "ALL" ? styles.activeTab : ""}`}>
            All
          </Link>
          <Link href="/quotations?status=DRAFT" className={`${styles.filterTab} ${currentStatus === "DRAFT" ? styles.activeTab : ""}`}>
            Drafts
          </Link>
          <Link href="/quotations?status=SENT" className={`${styles.filterTab} ${currentStatus === "SENT" ? styles.activeTab : ""}`}>
            Sent
          </Link>
          <Link href="/quotations?status=APPROVED" className={`${styles.filterTab} ${currentStatus === "APPROVED" ? styles.activeTab : ""}`}>
            Approved
          </Link>
          <Link href="/quotations?status=REJECTED" className={`${styles.filterTab} ${currentStatus === "REJECTED" ? styles.activeTab : ""}`}>
            Rejected
          </Link>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className={styles.emptyState}>
          <FileSignature size={48} className={styles.emptyIcon} />
          <h2>No Quotations</h2>
          <p>No quotation references match this status.</p>
          <Link href="/quotations/new" className="btn-primary" style={{marginTop: '16px'}}>
            Create Quotation Ref
          </Link>
        </div>
      ) : (
        <div className={styles.quoteList}>
          {quotations.map(quote => (
            <div key={quote.id} className={styles.quoteCard}>
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <div className={`${styles.iconWrapper} ${styles[quote.status.toLowerCase()] || styles.defaultIcon}`}>
                    <FileSignature size={24} />
                  </div>
                  <div>
                    <h3 className={styles.quoteNum}>{quote.quotationNumber}</h3>
                    <span className={styles.quoteDate}>{new Date(quote.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={styles.headerRight}>
                  <span className={`${styles.statusBadge} ${styles[quote.status.toLowerCase()]}`}>
                    {quote.status}
                  </span>
                  <div className={styles.amount}>
                    ${quote.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <p><strong>Customer:</strong> {quote.customer.name} {quote.customer.company ? `(${quote.customer.company})` : ''}</p>
                {quote.notes && <p className={styles.notes}>{quote.notes}</p>}
                
                {quote.pdfUrl && (
                  <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                    <Download size={14} /> Download PDF
                  </a>
                )}
              </div>
              
              <form action={updateQuotationStatus} className={styles.cardActions}>
                <input type="hidden" name="quotationId" value={quote.id} />
                
                <span className={styles.actionLabel}>Update Status:</span>
                
                {quote.status !== "SENT" && (
                  <button type="submit" name="status" value="SENT" className={`${styles.actionBtn} ${styles.btnSent}`} title="Mark as Sent">
                    <ArrowRightCircle size={16} /> Sent
                  </button>
                )}
                
                {quote.status !== "APPROVED" && (
                  <button type="submit" name="status" value="APPROVED" className={`${styles.actionBtn} ${styles.btnApprove}`} title="Mark Approved">
                    <CheckCircle size={16} /> Approve
                  </button>
                )}
                
                {quote.status !== "REJECTED" && (
                  <button type="submit" name="status" value="REJECTED" className={`${styles.actionBtn} ${styles.btnReject}`} title="Mark Rejected">
                    <XCircle size={16} /> Reject
                  </button>
                )}
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
