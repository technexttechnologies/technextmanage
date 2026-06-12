import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, FileText, FileSignature, CreditCard, Trash2 } from "lucide-react";
import styles from "./page.module.css";
import { deleteAroniumRef } from "./actions";

export default async function AroniumPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const currentFilter = (await searchParams).filter || "ALL";

  const refs = await prisma.aroniumReference.findMany({
    where: currentFilter === "ALL" ? {} : { refType: currentFilter },
    include: {
      customer: true
    },
    orderBy: { id: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Aronium References</h1>
          <p className={styles.subtitle}>Link Aronium POS invoices, quotations, and payments to CRM customers.</p>
        </div>
        <Link href="/aronium/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Link Document</span>
        </Link>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by ID or customer..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          <Link href="/aronium?filter=ALL" className={`${styles.filterTab} ${currentFilter === "ALL" ? styles.activeTab : ""}`}>
            All
          </Link>
          <Link href="/aronium?filter=Invoice" className={`${styles.filterTab} ${currentFilter === "Invoice" ? styles.activeTab : ""}`}>
            Invoices
          </Link>
          <Link href="/aronium?filter=Quotation" className={`${styles.filterTab} ${currentFilter === "Quotation" ? styles.activeTab : ""}`}>
            Quotations
          </Link>
          <Link href="/aronium?filter=Payment" className={`${styles.filterTab} ${currentFilter === "Payment" ? styles.activeTab : ""}`}>
            Payments
          </Link>
        </div>
      </div>

      {refs.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} className={styles.emptyIcon} />
          <h2>No Linked Documents</h2>
          <p>No Aronium records match this filter.</p>
          <Link href="/aronium/new" className="btn-primary" style={{marginTop: '16px'}}>
            Link Aronium Document
          </Link>
        </div>
      ) : (
        <div className={styles.refList}>
          {refs.map(ref => {
            let Icon = FileText;
            if (ref.refType === "Quotation") Icon = FileSignature;
            if (ref.refType === "Payment") Icon = CreditCard;

            return (
              <div key={ref.id} className={styles.refCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <div className={`${styles.iconWrapper} ${styles[ref.refType.toLowerCase()]}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <span className={styles.refType}>{ref.refType}</span>
                      <h3 className={styles.refNumber}>#{ref.refNumber}</h3>
                    </div>
                  </div>
                  <form action={deleteAroniumRef}>
                    <input type="hidden" name="refId" value={ref.id} />
                    <button type="submit" className={styles.deleteBtn} aria-label="Unlink document">
                      <Trash2 size={18} />
                    </button>
                  </form>
                </div>

                <div className={styles.customerInfo}>
                  <strong>Customer:</strong> {ref.customer.name} {ref.customer.company ? `(${ref.customer.company})` : ''}
                </div>
                
                {ref.notes && (
                  <p className={styles.notes}>{ref.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
