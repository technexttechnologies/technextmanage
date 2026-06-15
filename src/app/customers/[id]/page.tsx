export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Edit, FileText, ShoppingCart, RefreshCw, PhoneCall, ShieldCheck, MessageCircle, Package, Globe, Server } from "lucide-react";
import { getWhatsAppLink, waTemplates } from "@/lib/whatsappTemplates";
import styles from "./page.module.css";
import EditCustomerButton from "./EditCustomerButton";
import { CustomerActionButtons } from "../CustomerActionButtons";
import { PackageActionButtons } from "@/app/packages/PackageActionButtons";
import { DomainActionButtons } from "@/app/domains/DomainActionButtons";
import { HostingActionButtons } from "@/app/hosting/HostingActionButtons";
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
      amcs: { orderBy: { startDate: 'desc' } },
      packages: { orderBy: { createdAt: 'desc' } },
      domains: { orderBy: { expiryDate: 'asc' } },
      hostingAccounts: { orderBy: { renewalDate: 'asc' } }
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
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a 
            href={getWhatsAppLink(
              customer.phone,
              waTemplates.portalShare(
                customer.name,
                `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${customer.portalToken}`
              )
            )}
            target="_blank" 
            rel="noreferrer" 
            className="btn-secondary" 
            style={{ backgroundColor: '#10B981', color: 'white', borderColor: '#10B981' }}
          >
            <MessageCircle size={16} /> Share Portal
          </a>
          {customer.email && (
            <a 
              href={`mailto:${customer.email}`}
              className="btn-primary" 
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              <Mail size={16} /> Email
            </a>
          )}
          <CustomerActionButtons customerId={customer.id} variant="full" />
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
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                    TN-{customer.customerNumber}
                  </span>
                </div>
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

          {/* Service Packages */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Package size={20} /> Service Packages
            </h2>
            {customer.packages.length === 0 ? (
              <p className={styles.textMuted}>No service packages linked.</p>
            ) : (
              <div className={styles.projectGrid}>
                {customer.packages.map(pkg => (
                  <div key={pkg.id} className={styles.projectCard}>
                    <h3>{pkg.packageName}</h3>
                    <div className={styles.pMeta}>
                      <span className={styles.pStatus}>{pkg.status}</span>
                      <span>Type: {pkg.packageType}</span>
                    </div>
                    {pkg.renewalDate && <p className={styles.textMuted} style={{marginTop: '8px', fontSize: '14px'}}>Renewal: {pkg.renewalDate.toLocaleDateString()}</p>}
                    <div style={{marginTop: '12px'}}>
                      <PackageActionButtons packageId={pkg.id} customerEmail={customer.email} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href={`/packages/new?customerId=${customer.id}`} className={styles.linkAction} style={{marginTop: '16px', display: 'inline-block'}}>+ Add Package</Link>
          </section>

          {/* Domains */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Globe size={20} /> Domains
            </h2>
            {customer.domains.length === 0 ? (
              <p className={styles.textMuted}>No domains linked.</p>
            ) : (
              <div className={styles.projectGrid}>
                {customer.domains.map(domain => (
                  <div key={domain.id} className={styles.projectCard}>
                    <h3>{domain.domainName}</h3>
                    <div className={styles.pMeta}>
                      <span className={styles.pStatus}>{domain.status}</span>
                      <span>Expiry: {domain.expiryDate.toLocaleDateString()}</span>
                    </div>
                    <div style={{marginTop: '12px'}}>
                      <DomainActionButtons domainId={domain.id} customerEmail={customer.email} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href={`/domains/new?customerId=${customer.id}`} className={styles.linkAction} style={{marginTop: '16px', display: 'inline-block'}}>+ Add Domain</Link>
          </section>

          {/* Hosting */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Server size={20} /> Hosting Accounts
            </h2>
            {customer.hostingAccounts.length === 0 ? (
              <p className={styles.textMuted}>No hosting accounts linked.</p>
            ) : (
              <div className={styles.projectGrid}>
                {customer.hostingAccounts.map(host => (
                  <div key={host.id} className={styles.projectCard}>
                    <h3>{host.hostingPlan}</h3>
                    <div className={styles.pMeta}>
                      <span className={styles.pStatus}>{host.status}</span>
                      <span>Renewal: {host.isLifetime || !host.renewalDate ? 'Lifetime' : host.renewalDate.toLocaleDateString()}</span>
                    </div>
                    <div style={{marginTop: '12px'}}>
                      <HostingActionButtons hostingId={host.id} customerEmail={customer.email} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href={`/hosting/new?customerId=${customer.id}`} className={styles.linkAction} style={{marginTop: '16px', display: 'inline-block'}}>+ Add Hosting</Link>
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
