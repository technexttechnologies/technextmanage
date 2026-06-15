export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
  Globe, 
  Server, 
  Briefcase, 
  Package, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  FileText,
  LifeBuoy,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { PortalHeader } from "./PortalHeader";
import Link from "next/link";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      domains: true,
      hostingAccounts: true,
      packages: true,
      projects: true,
      quotationRequests: { orderBy: { createdAt: 'desc' } },
      quotations: { orderBy: { date: 'desc' } },
      invoiceRequests: { orderBy: { createdAt: 'desc' } },
      supportTickets: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!customer) {
    return notFound();
  }

  const isExpiringSoon = (date: Date | null) => {
    if (!date) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(date) <= thirtyDaysFromNow && new Date(date) >= new Date();
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getStatusBadge = (date: Date | null) => {
    if (isExpired(date)) {
      return <span style={{ color: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Expired</span>;
    }
    if (isExpiringSoon(date)) {
      return <span style={{ color: "var(--color-warning)", backgroundColor: "var(--color-warning-bg)", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Expiring Soon</span>;
    }
    return <span style={{ color: "var(--color-success)", backgroundColor: "var(--color-success-bg)", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Active</span>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-background)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <PortalHeader customer={customer} token={token} />

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <Link href={`/portal/${token}/updates/new`} style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#8B5CF6', color: 'white', padding: '16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }}>
            <Globe size={20} /> Request Project Update
          </Link>
          <Link href={`/portal/${token}/tickets/new`} style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--brand-primary)', color: 'white', padding: '16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }}>
            <LifeBuoy size={20} /> Open Support Ticket
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Domains */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <Globe size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Domains</h2>
            </div>
            {customer.domains.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No active domains found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.domains.map(domain => (
                  <div key={domain.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{domain.domainName}</strong>
                      {getStatusBadge(domain.expiryDate)}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Registrar: {domain.registrar}</p>
                      <p style={{ margin: '4px 0' }}>Expires: {format(new Date(domain.expiryDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hosting */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <Server size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Hosting Accounts</h2>
            </div>
            {customer.hostingAccounts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hosting accounts found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.hostingAccounts.map(hosting => (
                  <div key={hosting.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{hosting.hostingPlan}</strong>
                      {getStatusBadge(hosting.renewalDate)}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Provider: {hosting.hostingProvider}</p>
                    {hosting.renewalDate ? (
                      <p style={{ margin: '4px 0' }}>Renews: {format(new Date(hosting.renewalDate), 'MMM dd, yyyy')}</p>
                    ) : (
                      <p style={{ margin: '4px 0' }}>Renews: <span style={{ fontWeight: 600 }}>Lifetime</span></p>
                    )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Packages */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <Package size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Service Packages</h2>
            </div>
            {customer.packages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No service packages found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.packages.map(pkg => (
                  <div key={pkg.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{pkg.packageName}</strong>
                      {getStatusBadge(pkg.renewalDate)}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Type: {pkg.packageType}</p>
                      {pkg.renewalDate && (
                        <p style={{ margin: '4px 0' }}>Renews: {format(new Date(pkg.renewalDate), 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <Briefcase size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Projects</h2>
            </div>
            {customer.projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No active projects found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.projects.map(project => (
                  <div key={project.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{project.name}</strong>
                      <span style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Progress: {project.progress}%</p>
                      <div style={{ width: '100%', backgroundColor: 'var(--surface-border)', height: '8px', borderRadius: '4px', marginTop: '8px', marginBottom: '12px' }}>
                        <div style={{ width: `${project.progress}%`, backgroundColor: 'var(--brand-accent)', height: '100%', borderRadius: '4px' }}></div>
                      </div>
                      <Link href={`/portal/${token}/projects/${project.id}`} style={{ display: 'inline-block', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proposals / Quotation Requests */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <ClipboardList size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Proposals</h2>
            </div>
            {customer.quotationRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No proposals requested.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.quotationRequests.map(req => (
                  <div key={req.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{req.serviceName}</strong>
                      <span style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Priority: {req.priority}</p>
                      <p style={{ margin: '4px 0' }}>Requested: {format(new Date(req.createdAt), 'MMM dd, yyyy')}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <Link href={`/track/${req.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'white', backgroundColor: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>
                          Track Progress 📍
                        </Link>
                        {req.pdfUrl && (
                          <a href={req.pdfUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', backgroundColor: 'var(--surface-background)', border: '1px solid var(--surface-border)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>
                            Download PDF ⬇️
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotations */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <FileSignature size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Quotations</h2>
            </div>
            {customer.quotations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No quotations available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.quotations.map(quote => (
                  <div key={quote.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{quote.quotationNumber || `QUOTE-${quote.id.slice(-6).toUpperCase()}`}</strong>
                      <span style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {quote.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Amount: ₹{quote.totalAmount.toFixed(2)}</p>
                      <p style={{ margin: '4px 0 12px 0' }}>Date: {format(new Date(quote.date), 'MMM dd, yyyy')}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <Link href={`/portal/${token}/quotations/${quote.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'white', backgroundColor: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>
                          View Details →
                        </Link>
                        {quote.pdfUrl && (
                          <a href={quote.pdfUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', backgroundColor: 'var(--surface-background)', border: '1px solid var(--surface-border)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>
                            Download PDF ⬇️
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--brand-primary)' }}>
              <FileText size={24} />
              <h2 style={{ fontSize: '20px', margin: 0 }}>Invoices</h2>
            </div>
            {customer.invoiceRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No invoices available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.invoiceRequests.map(invoice => (
                  <div key={invoice.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{invoice.aroniumInvoiceNo || `INV-${invoice.id.slice(-6).toUpperCase()}`}</strong>
                      <span style={{ backgroundColor: invoice.status === 'PAID' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', color: invoice.status === 'PAID' ? 'var(--color-success)' : 'var(--color-warning)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {invoice.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Amount: ₹{invoice.amountRequested.toFixed(2)}</p>
                      <p style={{ margin: '4px 0 12px 0' }}>Date: {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <Link href={`/portal/${token}/invoices/${invoice.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'white', backgroundColor: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>
                          View Invoice Details →
                        </Link>
                        {invoice.pdfUrl && (
                          <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', backgroundColor: 'var(--surface-background)', border: '1px solid var(--surface-border)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>
                            Download PDF ⬇️
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support Tickets */}
          <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--brand-primary)' }}>
                <LifeBuoy size={24} />
                <h2 style={{ fontSize: '20px', margin: 0 }}>Support Tickets</h2>
              </div>
              <Link href={`/portal/${token}/tickets/new`} style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>
                New Ticket
              </Link>
            </div>
            {customer.supportTickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No support tickets found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.supportTickets.map(ticket => (
                  <div key={ticket.id} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{ticket.subject}</strong>
                      <span style={{ backgroundColor: ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', color: ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' ? 'var(--color-success)' : 'var(--color-warning)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '4px 0' }}>Priority: {ticket.priority}</p>
                      <p style={{ margin: '4px 0' }}>Date: {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
