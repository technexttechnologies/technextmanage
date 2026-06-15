"use client";

import { useState } from "react";
import { updateQuotationStatus } from "./actions";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function QuotationActionButtons({ quoteId, token, currentStatus }: { quoteId: string, token: string, currentStatus: string }) {
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this quotation?`)) return;
    
    setLoading(status);
    setError(null);
    try {
      await updateQuotationStatus(quoteId, token, status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  if (currentStatus === "APPROVED") {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 'bold', padding: '12px 20px', backgroundColor: 'var(--color-success-bg)', borderRadius: '8px' }}>
        <CheckCircle size={20} /> You have approved this quotation.
      </div>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', fontWeight: 'bold', padding: '12px 20px', backgroundColor: 'var(--color-danger-bg)', borderRadius: '8px' }}>
        <XCircle size={20} /> You have rejected this quotation.
      </div>
    );
  }

  return (
    <div>
      {error && <p style={{ color: 'var(--color-danger)', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => handleAction("APPROVED")}
          disabled={loading !== null}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'var(--color-success)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}
        >
          {loading === "APPROVED" ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
          Accept Quotation
        </button>

        <button
          onClick={() => handleAction("REJECTED")}
          disabled={loading !== null}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}
        >
          {loading === "REJECTED" ? <Loader2 size={18} className="spin" /> : <XCircle size={18} />}
          Reject
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
