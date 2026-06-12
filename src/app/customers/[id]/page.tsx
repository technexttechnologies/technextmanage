export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Edit, FileText, ShoppingCart, RefreshCw, PhoneCall, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";
import EditCustomerButton from "./EditCustomerButton";
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
      invoiceRequests: { orderBy: { createdAt: 'desc' } },
      amcs: { orderBy: { startDate: 'desc' } }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <a 
            href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(customer.name)}`} 
            target="_blank" 
            rel="noreferrer" 
            className="btn-secondary" 
            style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
            Send WhatsApp
          </a>
          <EditCustomerButton customer={customer} />
        </div>
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

          {/* AMCs */}
          <section className={styles.sideSection}>
            <h3 className={styles.sideTitle}>
              <ShieldCheck size={18} /> Active AMCs
            </h3>
            {customer.amcs.length === 0 ? (
              <p className={styles.textMuted}>No active AMCs.</p>
            ) : (
              <div className={styles.sideList}>
                {customer.amcs.map(amc => (
                  <div key={amc.id} className={styles.sideItem}>
                    <div className={styles.fuHeader}>
                      <span className={styles.fuType} style={{ color: amc.status === 'ACTIVE' ? '#16A34A' : undefined }}>{amc.title}</span>
                      <span className={styles.fuDate}>{new Date(amc.endDate).toLocaleDateString()}</span>
                    </div>
                    {amc.status !== 'ACTIVE' && <p className={styles.fuNotes}>Status: {amc.status}</p>}
                  </div>
                ))}
              </div>
            )}
            <Link href="/amc/new" className={styles.linkAction}>+ Add AMC</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
