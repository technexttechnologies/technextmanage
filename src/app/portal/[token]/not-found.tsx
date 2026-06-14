import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function PortalNotFound() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{ 
          backgroundColor: '#fee2e2', 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <AlertCircle size={32} color="#ef4444" />
        </div>
        
        <h1 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 12px 0' }}>Portal Link Invalid</h1>
        
        <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
          We couldn't find your client portal. This link may be expired, broken, or generated incorrectly. Please contact your account manager for a fresh access link.
        </p>
        
        <a 
          href="https://technexttechnologies.in" 
          style={{
            display: 'inline-block',
            backgroundColor: '#0A2540',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
        >
          Return to Technext
        </a>
      </div>
    </div>
  );
}
