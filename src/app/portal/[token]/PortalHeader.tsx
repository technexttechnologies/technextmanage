import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PortalHeader({ customer, token, backLink = false }: { customer: any, token: string, backLink?: boolean }) {
  return (
    <div style={{ backgroundColor: 'var(--surface-card)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
      {backLink && (
        <Link href={`/portal/${token}`} style={{ position: 'absolute', top: '30px', right: '30px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      )}
      <div style={{ display: 'inline-block', alignSelf: 'flex-start', marginBottom: '10px' }}>
        <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{ width: '150px', filter: 'brightness(0)' }} />
      </div>
      <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: 0 }}>Client Portal</h1>
      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '18px' }}>Welcome back, {customer.name} {customer.company && `(${customer.company})`}</p>
    </div>
  );
}
