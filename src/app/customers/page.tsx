export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Phone, Mail, Building2, UserCircle, Lock } from "lucide-react";
import { WhatsAppWelcomeTrigger } from "./WhatsAppWelcomeTrigger";
import { CustomerActionButtons } from "./CustomerActionButtons";
import styles from "./page.module.css";
import { getSession } from "@/lib/auth";

function maskPhone(phone?: string | null): string {
  if (!phone) return "—";
  const clean = phone.trim();
  if (clean.length <= 4) return "****";
  const last4 = clean.slice(-4);
  const first3 = clean.slice(0, 3);
  return `${first3}*** ***${last4}`;
}

function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const name = parts[0];
  const domain = parts[1];
  const firstLetter = name.charAt(0);
  return `${firstLetter}***@${domain}`;
}

export default async function CustomersPage({ searchParams }: { searchParams: { wa_welcome?: string, wa_phone?: string, wa_name?: string } }) {
  const session = await getSession();
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HEAD", "OPERATIONS"].includes(session?.role as string);

  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
    include: {
      accessRequests: session?.userId ? {
        where: { requestedById: session.userId },
      } : undefined,
      quotationRequests: session?.userId ? {
        where: { requestedById: session.userId },
        select: { id: true },
      } : undefined,
      invoiceRequests: session?.userId ? {
        where: { requestedById: session.userId },
        select: { id: true },
      } : undefined,
      projects: session?.userId ? {
        where: { salesRepId: session.userId },
        select: { id: true },
      } : undefined,
      packages: session?.userId ? {
        where: { salesRepId: session.userId },
        select: { id: true },
      } : undefined,
    },
  });

  return (
    <div className={styles.container}>
      {searchParams?.wa_welcome === "1" && searchParams.wa_phone && (
        <WhatsAppWelcomeTrigger phone={searchParams.wa_phone} name={searchParams.wa_name || ""} />
      )}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers Directory</h1>
          <p className={styles.subtitle}>
            {session?.role === "SALES" 
              ? "Your client accounts. Other company clients require admin approval to access details."
              : "Manage all enterprise client records, deal ownership, and access permissions."
            }
          </p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add Customer</span>
        </Link>
      </header>

      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search customers..." 
          className={styles.searchInput}
        />
      </div>

      {customers.length === 0 ? (
        <div className={styles.emptyState}>
          <UserCircle size={48} className={styles.emptyIcon} />
          <h2>No customers yet</h2>
          <p>Get started by adding your first customer.</p>
          <Link href="/customers/new" className="btn-primary" style={{marginTop: '16px'}}>
            Add Customer
          </Link>
        </div>
      ) : (
        <div className={styles.customerList}>
          {customers.map(customer => {
            const hasAccess = isAdmin || 
              customer.assignedToId === session?.userId ||
              customer.accessRequests?.some(r => r.status === "APPROVED") ||
              (customer.quotationRequests && customer.quotationRequests.length > 0) ||
              (customer.invoiceRequests && customer.invoiceRequests.length > 0) ||
              (customer.projects && customer.projects.length > 0) ||
              (customer.packages && customer.packages.length > 0);

            return (
              <div key={customer.id} className={styles.customerCard}>
                <Link href={`/customers/${customer.id}`} className={styles.cardHeaderLink}>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3>
                        {customer.name} 
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginLeft: '8px' }}>
                          TN-{customer.customerNumber}
                        </span>
                        {!hasAccess && (
                          <span style={{ 
                            fontSize: '11px', 
                            background: '#f1f5f9', 
                            color: '#64748b', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            marginLeft: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Lock size={10} /> Locked
                          </span>
                        )}
                      </h3>
                      {customer.company && (
                        <p className={styles.company}>
                          <Building2 size={14} /> {customer.company}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span className={`${styles.statusBadge} ${styles[customer.status.toLowerCase()] || styles.default}`}>
                        {customer.status}
                      </span>
                      {hasAccess && <CustomerActionButtons customerId={customer.id} variant="icon" />}
                    </div>
                  </div>
                </Link>
                
                <div className={styles.cardActions}>
                  {hasAccess ? (
                    <>
                      <a href={`tel:${customer.phone}`} className={styles.actionBtn}>
                        <Phone size={18} /> Call
                      </a>
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className={styles.actionBtn}>
                          <Mail size={18} /> Email
                        </a>
                      )}
                    </>
                  ) : (
                    <Link href={`/customers/${customer.id}`} className={styles.actionBtn} style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
                      <Lock size={15} /> Request Admin Access
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
