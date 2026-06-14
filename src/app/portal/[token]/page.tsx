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
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      domains: true,
      hostingAccounts: true,
      packages: true,
      projects: true,
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
        <div style={{ backgroundColor: 'var(--surface-card)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{ width: '150px', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: 0 }}>Client Portal</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '18px' }}>Welcome back, {customer.name} {customer.company && `(${customer.company})`}</p>
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
                      <p style={{ margin: '4px 0' }}>Renews: {format(new Date(hosting.renewalDate), 'MMM dd, yyyy')}</p>
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
                      <div style={{ width: '100%', backgroundColor: 'var(--surface-border)', height: '8px', borderRadius: '4px', marginTop: '8px' }}>
                        <div style={{ width: `${project.progress}%`, backgroundColor: 'var(--brand-accent)', height: '100%', borderRadius: '4px' }}></div>
                      </div>
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
