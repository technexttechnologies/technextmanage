export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Edit, FileText, ShoppingCart, RefreshCw, PhoneCall } from "lucide-react";
import styles from "./page.module.css";
import { redirect } from "next/navigation";

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: resolvedParams.id },
    include: {
      projects: { orderBy: { createdAt: 'desc' } },
      followUps: { orderBy: { date: 'asc' } },
      renewals: { orderBy: { expiryDate: 'asc' } },
      quotations: { orderBy: { date: 'desc' } },
      aroniumRefs: { orderBy: { id: 'desc' } },
      quotationRequests: { orderBy: { createdAt: 'desc' } },
      invoiceRequests: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!customer) {
    redirect("/customers");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/customers" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Customers</span>
        </Link>
        <button className="btn-secondary">
          <Edit size={16} /> Edit Profile
        </button>
      </header>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          {/* Profile Card */}
          <section className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarLarge}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.name}>{customer.name}</h1>
                <span className={`${styles.statusBadge} ${styles[customer.status.toLowerCase()] || styles.default}`}>
                  {customer.status}
                </span>
              </div>
            </div>

            <div className={styles.contactGrid}>
              <div className={styles.contactItem}>
                <Phone size={16} />
                <a href={`tel:${customer.phone}`}>{customer.phone}</a>
              </div>
              {customer.email && (
                <div className={styles.contactItem}>
                  <Mail size={16} />
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </div>
              )}
              {customer.company && (
                <div className={styles.contactItem}>
                  <Building2 size={16} />
                  <span>{customer.company}</span>
                </div>
              )}
              {customer.address && (
                <div className={styles.contactItem}>
                  <MapPin size={16} />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
            
            {customer.notes && (
              <div className={styles.notesSection}>
                <h3>General Notes</h3>
                <p>{customer.notes}</p>
              </div>
            )}
          </section>

          {/* Aronium Integration Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <ShoppingCart size={20} /> Aronium Billing & Quotations
            </h2>
            <div className={styles.aroniumCard}>
              <div className={styles.aroniumHeader}>
                <div className={styles.syncStatus}>
                  <span className={`${styles.syncBadge} ${styles[customer.syncStatus.toLowerCase()]}`}>
                    Sync: {customer.syncStatus}
                  </span>
                  {customer.aroniumCode && <span className={styles.aroniumId}>ID: {customer.aroniumCode}</span>}
                </div>
                <div className={styles.billingNotesGrid}>
                  <div>
                    <label>Billing Notes:</label>
                    <p>{customer.billingNotes || "None"}</p>
                  </div>
                  <div>
                    <label>Payment Status:</label>
                    <p>{customer.paymentStatus || "Unknown"}</p>
                  </div>
                </div>
              </div>

              <div className={styles.aroniumLists} style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className={styles.listBlock}>
                  <h3>Quotation Requests</h3>
                  {customer.quotationRequests.length === 0 ? (
                    <p className={styles.textMuted}>No quotation requests linked.</p>
                  ) : (
                    <ul className={styles.simpleList}>
                      {customer.quotationRequests.map(q => (
                        <li key={q.id}>
                          <Link href={`/quotation-requests/${q.id}`} className={styles.qNum}>#{q.id.slice(-6).toUpperCase()}</Link>
                          <span className={styles.qStatus}>{q.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/quotation-requests/new" className={styles.linkAction}>+ Request Quotation</Link>
                </div>

                <div className={styles.listBlock}>
                  <h3>Invoice Requests</h3>
                  {customer.invoiceRequests.length === 0 ? (
                    <p className={styles.textMuted}>No invoice requests linked.</p>
                  ) : (
                    <ul className={styles.simpleList}>
                      {customer.invoiceRequests.map(ref => (
                        <li key={ref.id}>
                          <Link href={`/invoice-requests/${ref.id}`} className={styles.qNum}>#{ref.id.slice(-6).toUpperCase()}</Link>
                          <span className={styles.qStatus}>{ref.status}</span>
                          <span className={styles.qAmount}>₹{ref.amountRequested.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/invoice-requests/new" className={styles.linkAction}>+ Request Invoice</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Projects */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileText size={20} /> Projects
            </h2>
            {customer.projects.length === 0 ? (
              <p className={styles.textMuted}>No active projects for this customer.</p>
            ) : (
              <div className={styles.projectGrid}>
                {customer.projects.map(p => (
                  <div key={p.id} className={styles.projectCard}>
                    <h3>{p.name}</h3>
                    <div className={styles.pMeta}>
                      <span className={styles.pStatus}>{p.status}</span>
                      <span>Progress: {p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={styles.sideCol}>
          {/* Follow-ups */}
          <section className={styles.sideSection}>
            <h3 className={styles.sideTitle}>
              <PhoneCall size={18} /> Follow-ups
            </h3>
            {customer.followUps.length === 0 ? (
              <p className={styles.textMuted}>No scheduled follow-ups.</p>
            ) : (
              <div className={styles.sideList}>
                {customer.followUps.map(fu => (
                  <div key={fu.id} className={styles.sideItem}>
                    <div className={styles.fuHeader}>
                      <span className={styles.fuType}>{fu.type}</span>
                      <span className={styles.fuDate}>{new Date(fu.date).toLocaleDateString()}</span>
                    </div>
                    {fu.notes && <p className={styles.fuNotes}>{fu.notes}</p>}
                  </div>
                ))}
              </div>
            )}
            <Link href="/follow-ups/new" className={styles.linkAction}>+ Schedule</Link>
          </section>

          {/* Renewals */}
          <section className={styles.sideSection}>
            <h3 className={styles.sideTitle}>
              <RefreshCw size={18} /> Renewals
            </h3>
            {customer.renewals.length === 0 ? (
              <p className={styles.textMuted}>No active renewals.</p>
            ) : (
              <div className={styles.sideList}>
                {customer.renewals.map(r => (
                  <div key={r.id} className={styles.sideItem}>
                    <div className={styles.fuHeader}>
                      <span className={styles.fuType}>{r.type}</span>
                      <span className={styles.fuDate}>{new Date(r.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/renewals/new" className={styles.linkAction}>+ Add Service</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
