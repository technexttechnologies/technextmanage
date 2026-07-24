'use client';

import React, { useState } from 'react';
import { updateErpProduct } from '@/app/erp/integrations/aronium/actions';

export default function EditProductModal({ product, onClose }: { product: any, onClose: () => void }) {
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice);
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice);
  const [currentStock, setCurrentStock] = useState(product.currentStock);
  const [reorderLevel, setReorderLevel] = useState(product.reorderLevel);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateErpProduct(product.id, {
      sellingPrice,
      purchasePrice,
      currentStock,
      reorderLevel
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
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Edit Product: {product.name}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Selling Price</label>
            <input 
              type="number" 
              value={sellingPrice} 
              onChange={e => setSellingPrice(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Purchase Price</label>
            <input 
              type="number" 
              value={purchasePrice} 
              onChange={e => setPurchasePrice(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Current Stock</label>
            <input 
              type="number" 
              value={currentStock} 
              onChange={e => setCurrentStock(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Reorder Level</label>
            <input 
              type="number" 
              value={reorderLevel} 
              onChange={e => setReorderLevel(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
            />
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
