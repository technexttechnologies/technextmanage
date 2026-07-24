'use client';

import React, { useState } from 'react';
import { updateErpSale } from '@/app/erp/integrations/aronium/actions';

export default function EditSaleModal({ sale, onClose }: { sale: any, onClose: () => void }) {
  const [totalAmount, setTotalAmount] = useState(sale.totalAmount);
  const [discount, setDiscount] = useState(sale.discount);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(sale.paymentStatus);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateErpSale(sale.id, {
      totalAmount,
      discount,
      paymentMethod,
      paymentStatus
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px',
        width: '400px', maxWidth: '90%', border: '1px solid var(--surface-border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Edit Sale: {sale.invoiceNumber}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Total Amount</label>
            <input 
              type="number" 
              value={totalAmount} 
              onChange={e => setTotalAmount(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Discount</label>
            <input 
              type="number" 
              value={discount} 
              onChange={e => setDiscount(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Payment Status</label>
            <select
              value={paymentStatus}
              onChange={e => setPaymentStatus(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            >
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', cursor: isSaving ? 'not-allowed' : 'pointer' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
