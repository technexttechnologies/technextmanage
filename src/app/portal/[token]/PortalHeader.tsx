import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PortalHeader({ customer, token, backLink = false }: { customer: any, token: string, backLink?: boolean }) {
  return (
    <div style={{ 
      backgroundColor: 'var(--surface-card)', 
      padding: '24px 20px', 
      borderRadius: '16px', 
      boxShadow: 'var(--shadow-sm)', 
      marginBottom: '24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      border: '1px solid var(--surface-border)'
    }}>
      {backLink && (
        <div style={{ marginBottom: '8px' }}>
          <Link 
            href={`/portal/${token}`} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: 'var(--brand-accent)', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '14px',
              padding: '6px 10px',
              background: 'var(--surface-background)',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <img 
          src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
          alt="TechNext Technologies" 
          style={{ height: '36px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} 
        />
        <span style={{ 
          background: 'var(--color-info-bg)', 
          color: 'var(--color-info)', 
          padding: '4px 10px', 
          borderRadius: '999px', 
          fontSize: '12px', 
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          Customer Portal
        </span>
      </div>
      <div>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>Client Hub</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
          Welcome back, <strong>{customer.name}</strong> {customer.company && `(${customer.company})`}
        </p>
      </div>
    </div>
  );
}
