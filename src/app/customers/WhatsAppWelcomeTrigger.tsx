"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

export function WhatsAppWelcomeTrigger({ phone, name }: { phone: string, name: string }) {
  const router = useRouter();

  if (!phone) return null;

  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

  const message = `Hi ${name}, welcome to Technext Technologies! We are thrilled to connect with you. Please let us know if you have any questions or require our IT services.`;
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  const closeMenu = () => {
    router.replace("/customers");
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white', padding: '24px', borderRadius: '16px',
        width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h2 style={{fontSize: '18px', fontWeight: 700}}>Customer Added!</h2>
          <button onClick={closeMenu} style={{padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>
            <X size={20} />
          </button>
        </div>
        
        <p style={{color: '#475569', marginBottom: '24px', lineHeight: 1.5}}>
          {name} was added successfully. Would you like to send them a welcome message on WhatsApp?
        </p>

        <div style={{display: 'flex', gap: '12px', flexDirection: 'column'}}>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={closeMenu}
            style={{
              backgroundColor: '#25D366', color: 'white', padding: '12px', 
              borderRadius: '8px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '8px', fontWeight: 600, textDecoration: 'none'
            }}
          >
            <MessageCircle size={20} />
            Send WhatsApp Welcome
          </a>
          <button 
            onClick={closeMenu}
            style={{
              backgroundColor: '#f1f5f9', color: '#475569', padding: '12px', 
              borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer'
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
