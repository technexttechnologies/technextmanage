export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Edit, FileText, ShoppingCart, RefreshCw, PhoneCall, ShieldCheck, MessageCircle, Package, Globe, Server, Lock, AlertCircle, Clock, KeyRound, Star } from "lucide-react";
import { getWhatsAppLink, waTemplates } from "@/lib/whatsappTemplates";
import styles from "./page.module.css";
import EditCustomerButton from "./EditCustomerButton";
import { CustomerActionButtons } from "../CustomerActionButtons";
import { PackageActionButtons } from "@/app/packages/PackageActionButtons";
import { DomainActionButtons } from "@/app/domains/DomainActionButtons";
import { HostingActionButtons } from "@/app/hosting/HostingActionButtons";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { requestClientAccess } from "@/app/sales/actions";

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

export default async function CustomerDetailsPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ existing?: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const customer = await prisma.customer.findUnique({
    where: { id: resolvedParams.id },
    include: {
      assignedTo: { select: { id: true, name: true } },
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
      hostingAccounts: { orderBy: { renewalDate: 'asc' } },
      accessRequests: {
        where: { requestedById: session.userId },
      },
    }
  });

  if (!customer) {
    redirect("/customers");
  }

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HEAD", "OPERATIONS"].includes(session.role as string);
  const isAssigned = customer.assignedToId === session.userId;
  const hasDeals = 
    customer.quotationRequests.some(q => q.requestedById === session.userId) ||
    customer.invoiceRequests.some(i => i.requestedById === session.userId) ||
    customer.projects.some(p => p.salesRepId === session.userId) ||
    customer.packages.some(pkg => pkg.salesRepId === session.userId);
  
  const userAccessRequest = customer.accessRequests[0];
  const isApproved = userAccessRequest?.status === "APPROVED";

  const hasFullAccess = isAdmin || isAssigned || hasDeals || isApproved;

  // IF ACCESS RESTRICTED FOR SALES STAFF: SHOW PROTECTED PROFILE SCREEN WITH APPROVAL REQUEST
  if (!hasFullAccess) {
    const isPending = userAccessRequest?.status === "PENDING";
    const isRejected = userAccessRequest?.status === "REJECTED";

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/customers" className={styles.backBtn}>
            <ArrowLeft size={20} />
            <span>Back to Customers</span>
          </Link>
        </header>

        <div style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "16px",
          padding: "36px 32px",
          maxWidth: "680px",
          margin: "32px auto",
          boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
          textAlign: "center"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto"
          }}>
            <Lock size={32} />
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--text-main)" }}>
            Client Profile Restricted
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px 0" }}>
            This customer is assigned to another team member or general pool. 
            Full contact numbers, remote credentials, and financial histories are protected and require <strong>Admin Approval</strong> to view.
          </p>

          <div style={{
            background: "rgba(0, 0, 0, 0.02)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "18px",
            textAlign: "left",
            marginBottom: "24px"
          }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Customer Identity:</div>
            <div style={{ fontSize: "17px", fontWeight: 700 }}>{customer.name}</div>
            {customer.company && <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{customer.company}</div>}
            
            <div style={{ marginTop: "14px", fontSize: "13px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>Phone: <strong style={{ fontFamily: "monospace" }}>{maskPhone(customer.phone)}</strong></div>
              <div>Email: <strong style={{ fontFamily: "monospace" }}>{maskEmail(customer.email)}</strong></div>
              <div>Assigned Rep: <strong>{customer.assignedTo?.name || "General Pool"}</strong></div>
              <div>Status: <strong>{customer.status}</strong></div>
            </div>
          </div>

          {isPending ? (
            <div style={{
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
              padding: "16px",
              borderRadius: "10px",
              fontSize: "14px",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <Clock size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong>Access Request Pending Admin Approval:</strong> Your request was submitted on {new Date(userAccessRequest.createdAt).toLocaleDateString()} and is awaiting review by Super Admin.
              </div>
            </div>
          ) : (
            <div>
              {isRejected && (
                <div style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  textAlign: "left",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Previous Request Denied by Admin:</strong> {userAccessRequest.adminRemarks || "No remarks provided"}. You may submit a new request below with additional context.
                  </div>
                </div>
              )}

              <form action={requestClientAccess} style={{ textAlign: "left" }}>
                <input type="hidden" name="customerId" value={customer.id} />
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Reason for Requesting Client Access *
                </label>
                <textarea 
                  name="reason" 
                  required 
                  rows={3} 
                  placeholder="Explain why you need access (e.g. Client called our sales desk requesting an immediate quotation on software upgrade / renewal)..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    fontSize: "14px",
                    marginBottom: "16px",
                    outline: "none"
                  }}
                />
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: "100%", padding: "12px", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Lock size={16} /> Request Admin Approval to View Details
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FULL ACCESS VIEW (ADMIN OR APPROVED SALES REP)
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/customers" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Customers</span>
        </Link>
        <div className={styles.headerActions}>
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
          <a 
            href={getWhatsAppLink(
              customer.phone,
              waTemplates.customerReview(customer.name)
            )}
            target="_blank" 
            rel="noreferrer" 
            className="btn-secondary" 
            style={{ backgroundColor: '#F59E0B', color: 'white', borderColor: '#F59E0B' }}
          >
            <Star size={16} /> Request Review
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
      {resolvedSearchParams.existing === "1" && (
        <div style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e40af",
          padding: "12px 18px",
          borderRadius: "8px",
          marginBottom: "18px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}>
          <ShieldCheck size={20} color="#2563eb" />
          <div>
            <strong>Existing Customer Profile:</strong> A customer with matching phone number or email was already found in the system. Any newly submitted details have been merged into this existing record.
          </div>
        </div>
      )}
      <div className={styles.grid}>
        <div className={styles.mainCol}>
          {/* Profile Card */}
          <section className={styles.card}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <div className={styles.avatarLarge}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className={styles.name}>{customer.name}</h1>
                  <span className={styles.badge} style={{ fontSize: '12px', background: '#e2e8f0', color: '#334155' }}>
                    Customer #{customer.customerNumber}
                  </span>
                  {customer.company && (
                    <p className={styles.company}>
                      <Building2 size={16} />
                      <span>{customer.company}</span>
                    </p>
                  )}
                  {customer.assignedTo && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Assigned Representative: <strong>{customer.assignedTo.name}</strong>
                    </p>
                  )}
                </div>
              </div>
              <div className={styles.profileBadges}>
                <span className={`${styles.statusBadge} ${styles[customer.status.toLowerCase()] || styles.default}`}>
                  {customer.status}
                </span>
                <EditCustomerButton customer={customer} />
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <Phone size={18} className={styles.detailIcon} />
                <div>
                  <span className={styles.detailLabel}>Phone</span>
                  <a href={`tel:${customer.phone}`} className={styles.detailValue}>{customer.phone}</a>
                </div>
              </div>
              {customer.email && (
                <div className={styles.detailItem}>
                  <Mail size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Email</span>
                    <a href={`mailto:${customer.email}`} className={styles.detailValue}>{customer.email}</a>
                  </div>
                </div>
              )}
              {customer.gstNumber && (
                <div className={styles.detailItem}>
                  <FileText size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>GST Number</span>
                    <span className={styles.detailValue}>{customer.gstNumber}</span>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className={styles.detailItem}>
                  <MapPin size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Address</span>
                    <span className={styles.detailValue}>{customer.address}</span>
                  </div>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className={styles.notesSection}>
                <h3>Notes</h3>
                <p>{customer.notes}</p>
              </div>
            )}
          </section>

          {/* Quotations Section */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FileText size={20} />
                <h2>Quotations ({customer.quotations.length})</h2>
              </div>
              <Link href={`/quotations/new?customerId=${customer.id}`} className="btn-secondary">
                New Quotation
              </Link>
            </div>
            
            {customer.quotations.length === 0 ? (
              <p className={styles.emptyText}>No quotations created yet.</p>
            ) : (
              <div className={styles.list}>
                {customer.quotations.map(quote => (
                  <div key={quote.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemTitle}>{quote.title}</div>
                      <div className={styles.itemMeta}>
                        <span>Date: {new Date(quote.date).toLocaleDateString()}</span>
                        {quote.validUntil && (
                          <span>Valid Until: {new Date(quote.validUntil).toLocaleDateString()}</span>
                        )}
                        <span className={`${styles.statusPill} ${styles[quote.status.toLowerCase()]}`}>
                          {quote.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={styles.amount}>₹{quote.totalAmount.toLocaleString('en-IN')}</span>
                      <Link href={`/quotation/${quote.id}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Projects Section */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <ShoppingCart size={20} />
                <h2>Projects ({customer.projects.length})</h2>
              </div>
              <Link href={`/projects/new?customerId=${customer.id}`} className="btn-secondary">
                New Project
              </Link>
            </div>

            {customer.projects.length === 0 ? (
              <p className={styles.emptyText}>No projects associated with this customer.</p>
            ) : (
              <div className={styles.list}>
                {customer.projects.map(project => (
                  <div key={project.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemTitle}>{project.name}</div>
                      <div className={styles.itemMeta}>
                        <span>Type: {project.type || "N/A"}</span>
                        <span>Progress: {project.progress}%</span>
                        <span className={`${styles.statusPill} ${styles[project.status.toLowerCase()] || styles.default}`}>
                          {project.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <Link href={`/projects/${project.id}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* AMC Section */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <RefreshCw size={20} />
                <h2>AMC Agreements ({customer.amcs.length})</h2>
              </div>
              <Link href={`/amc/new?customerId=${customer.id}`} className="btn-secondary">
                New AMC
              </Link>
            </div>

            {customer.amcs.length === 0 ? (
              <p className={styles.emptyText}>No active AMCs for this customer.</p>
            ) : (
              <div className={styles.list}>
                {customer.amcs.map(amc => (
                  <div key={amc.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemTitle}>{amc.serviceName}</div>
                      <div className={styles.itemMeta}>
                        <span>Start: {new Date(amc.startDate).toLocaleDateString()}</span>
                        <span>End: {new Date(amc.endDate).toLocaleDateString()}</span>
                        <span className={`${styles.statusPill} ${styles[amc.status.toLowerCase()] || styles.default}`}>
                          {amc.status}
                        </span>
                      </div>
                    </div>
                    <span className={styles.amount}>₹{amc.cost.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Service Packages Section */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Package size={20} />
                <h2>Service Packages ({customer.packages.length})</h2>
              </div>
              <Link href={`/packages/new?customerId=${customer.id}`} className="btn-secondary">
                New Package
              </Link>
            </div>

            {customer.packages.length === 0 ? (
              <p className={styles.emptyText}>No service packages active.</p>
            ) : (
              <div className={styles.list}>
                {customer.packages.map(pkg => (
                  <div key={pkg.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemTitle}>{pkg.packageName} ({pkg.packageType})</div>
                      <div className={styles.itemMeta}>
                        <span>Purchased: {new Date(pkg.purchaseDate).toLocaleDateString()}</span>
                        {pkg.renewalDate && <span>Renews: {new Date(pkg.renewalDate).toLocaleDateString()}</span>}
                        <span className={`${styles.statusPill} ${styles[pkg.status.toLowerCase()] || styles.default}`}>
                          {pkg.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.amount}>₹{pkg.packagePrice.toLocaleString('en-IN')}</span>
                      <PackageActionButtons packageId={pkg.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Domains Section */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Globe size={20} />
                <h2>Domains ({customer.domains.length})</h2>
              </div>
              <Link href={`/domains/new?customerId=${customer.id}`} className="btn-secondary">
                New Domain
              </Link>
            </div>

            {customer.domains.length === 0 ? (
              <p className={styles.emptyText}>No domains registered.</p>
            ) : (
              <div className={styles.list}>
                {customer.domains.map(domain => (
                  <div key={domain.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemTitle}>{domain.domainName} ({domain.registrar})</div>
                      <div className={styles.itemMeta}>
                        <span>Expires: {new Date(domain.expiryDate).toLocaleDateString()}</span>
                        <span className={`${styles.statusPill} ${styles[domain.status.toLowerCase()] || styles.default}`}>
                          {domain.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.amount}>₹{domain.domainCost.toLocaleString('en-IN')}</span>
                      <DomainActionButtons domainId={domain.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Hosting Accounts Section */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Server size={20} />
                <h2>Hosting Accounts ({customer.hostingAccounts.length})</h2>
              </div>
              <Link href={`/hosting/new?customerId=${customer.id}`} className="btn-secondary">
                New Hosting
              </Link>
            </div>

            {customer.hostingAccounts.length === 0 ? (
              <p className={styles.emptyText}>No hosting accounts configured.</p>
            ) : (
              <div className={styles.list}>
                {customer.hostingAccounts.map(hosting => (
                  <div key={hosting.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemTitle}>{hosting.hostingPlan} ({hosting.hostingProvider})</div>
                      <div className={styles.itemMeta}>
                        {hosting.renewalDate && <span>Renews: {new Date(hosting.renewalDate).toLocaleDateString()}</span>}
                        <span className={`${styles.statusPill} ${styles[hosting.status.toLowerCase()] || styles.default}`}>
                          {hosting.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.amount}>₹{hosting.hostingCost.toLocaleString('en-IN')}</span>
                      <HostingActionButtons hostingId={hosting.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={styles.sideCol}>
          {/* Remote Support & Credentials Card */}
          {(customer.anydeskId || customer.teamviewerId || customer.pcLoginDetails) && (
            <section className={styles.credentialsCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <KeyRound size={18} color="var(--brand-primary, #635bff)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Remote Support Credentials</h3>
              </div>
              {customer.anydeskId && (
                <div className={styles.credRow}>
                  <span className={styles.credLabel}>AnyDesk Address</span>
                  <span className={styles.credValue}>{customer.anydeskId}</span>
                </div>
              )}
              {customer.teamviewerId && (
                <div className={styles.credRow}>
                  <span className={styles.credLabel}>TeamViewer ID / Pass</span>
                  <span className={styles.credValue}>{customer.teamviewerId}</span>
                </div>
              )}
              {customer.pcLoginDetails && (
                <div className={styles.credRow} style={{ marginBottom: 0 }}>
                  <span className={styles.credLabel}>PC Login Details</span>
                  <span className={styles.credValue} style={{ whiteSpace: 'pre-wrap' }}>{customer.pcLoginDetails}</span>
                </div>
              )}
            </section>
          )}

          {/* Quick Actions / Integration Card */}
          <section className={styles.card}>
            <h3>Aronium POS Sync</h3>
            <div className={styles.detailItem} style={{ marginTop: '12px' }}>
              <div>
                <span className={styles.detailLabel}>Sync Status</span>
                <span className={`${styles.statusPill} ${customer.syncStatus === 'SYNCED' ? styles.active : styles.pending}`}>
                  {customer.syncStatus}
                </span>
              </div>
            </div>
            {customer.aroniumId && (
              <div className={styles.detailItem}>
                <div>
                  <span className={styles.detailLabel}>Aronium Customer ID</span>
                  <span className={styles.detailValue}>#{customer.aroniumId}</span>
                </div>
              </div>
            )}
            {customer.lastSyncDate && (
              <div className={styles.detailItem}>
                <div>
                  <span className={styles.detailLabel}>Last Synced</span>
                  <span className={styles.detailValue}>
                    {new Date(customer.lastSyncDate).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Follow-ups Card */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>Follow-ups</h3>
              <Link href={`/follow-ups/new?customerId=${customer.id}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                + Add
              </Link>
            </div>
            {customer.followUps.length === 0 ? (
              <p className={styles.emptyText}>No follow-ups scheduled.</p>
            ) : (
              <div className={styles.list}>
                {customer.followUps.map(fu => (
                  <div key={fu.id} className={styles.sideListItem}>
                    <div className={styles.itemTitle}>{fu.notes || "Follow-up"}</div>
                    <div className={styles.itemMeta}>
                      <span>{new Date(fu.date).toLocaleDateString()}</span>
                      <span className={`${styles.statusPill} ${styles[fu.status.toLowerCase()]}`}>{fu.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Renewals Card */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>Upcoming Renewals</h3>
            </div>
            {customer.renewals.length === 0 ? (
              <p className={styles.emptyText}>No upcoming renewals.</p>
            ) : (
              <div className={styles.list}>
                {customer.renewals.map(ren => (
                  <div key={ren.id} className={styles.sideListItem}>
                    <div className={styles.itemTitle}>{ren.serviceType}</div>
                    <div className={styles.itemMeta}>
                      <span>Expires: {new Date(ren.expiryDate).toLocaleDateString()}</span>
                      <span className={styles.amount}>₹{ren.cost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
