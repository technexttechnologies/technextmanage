'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import EditProductModal from '@/components/erp/aronium/EditProductModal';
import EditSaleModal from '@/components/erp/aronium/EditSaleModal';

interface AroniumDashboardClientProps {
  config: any;
  totalSales: number;
  totalProducts: number;
  lowStockItems: number;
  totalCustomers: number;
  products: any[];
  sales: any[];
}

export default function AroniumDashboardClient({
  config,
  totalSales,
  totalProducts,
  lowStockItems,
  totalCustomers,
  products,
  sales
}: AroniumDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sales'>('overview');
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingSale, setEditingSale] = useState<any | null>(null);

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '16px',
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
  };

  const thStyles = {
    padding: '12px 16px',
    textAlign: 'left' as const,
    borderBottom: '1px solid var(--surface-border)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.875rem'
  };

  const tdStyles = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--surface-border)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem'
  };

  const actionBtnStyles = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid var(--primary)',
    backgroundColor: 'transparent',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
    transition: 'all 0.2s'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Aronium ERP Integration
            <span className={`${styles.statusBadge} ${config.status === 'ONLINE' ? styles.statusOnline : styles.statusOffline}`}>
              {config.status}
            </span>
          </h1>
          <p className={styles.subtitle}>
            Branch: {config.branchName} | 
            Last Sync: {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : 'Never'}
          </p>
        </div>
        <Link href="/erp/integrations/aronium/setup" className={styles.downloadButton} style={{ background: 'var(--surface-border)', color: 'var(--text-primary)' }}>
          Settings
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'overview' ? 600 : 400, color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : 'none' }}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'inventory' ? 600 : 400, color: activeTab === 'inventory' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'inventory' ? '2px solid var(--primary)' : 'none' }}
        >
          Inventory
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'sales' ? 600 : 400, color: activeTab === 'sales' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'sales' ? '2px solid var(--primary)' : 'none' }}
        >
          Sales
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Sales</span>
              </div>
              <div className={styles.statValue}>{totalSales}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Products</span>
              </div>
              <div className={styles.statValue}>{totalProducts}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Low Stock Items</span>
              </div>
              <div className={styles.statValue}>{lowStockItems}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Synced Customers</span>
              </div>
              <div className={styles.statValue}>{totalCustomers}</div>
            </div>
          </div>

          <div className={styles.agentSection}>
            <h2 className={styles.agentTitle}>Sync Agent Setup</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
              To sync your local Aronium POS database with the cloud ERP, download the sync agent and configure it with your unique token.
            </p>
            
            <div className={styles.codeBlock}>
              <div>// Set this token in your sync agent configuration (.env or config.json)</div>
              <div>SYNC_TOKEN="<span className={styles.syncToken}>{config.syncToken}</span>"</div>
            </div>

            <a href="/aronium-sync-agent.js" download className={styles.downloadButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Sync Agent
            </a>
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Name</th>
                <th style={thStyles}>SKU</th>
                <th style={thStyles}>Category</th>
                <th style={thStyles}>Stock</th>
                <th style={thStyles}>Purchase Price</th>
                <th style={thStyles}>Selling Price</th>
                <th style={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ backgroundColor: product.isLowStock ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                  <td style={tdStyles}>{product.name}</td>
                  <td style={tdStyles}>{product.sku || '-'}</td>
                  <td style={tdStyles}>{product.category || '-'}</td>
                  <td style={tdStyles}>{product.currentStock}</td>
                  <td style={tdStyles}>₹{product.purchasePrice}</td>
                  <td style={tdStyles}>₹{product.sellingPrice}</td>
                  <td style={tdStyles}>
                    <button style={actionBtnStyles} onClick={() => setEditingProduct(product)}>Edit</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyles, textAlign: 'center', padding: '24px' }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sales' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Invoice No</th>
                <th style={thStyles}>Date</th>
                <th style={thStyles}>Total Amount</th>
                <th style={thStyles}>Discount</th>
                <th style={thStyles}>Payment Method</th>
                <th style={thStyles}>Status</th>
                <th style={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td style={tdStyles}>{sale.invoiceNumber}</td>
                  <td style={tdStyles}>{new Date(sale.date).toLocaleDateString()}</td>
                  <td style={tdStyles}>₹{sale.totalAmount}</td>
                  <td style={tdStyles}>₹{sale.discount}</td>
                  <td style={tdStyles}>{sale.paymentMethod}</td>
                  <td style={tdStyles}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: sale.paymentStatus === 'PAID' ? 'rgba(34, 197, 94, 0.2)' : sale.paymentStatus === 'PARTIAL' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: sale.paymentStatus === 'PAID' ? '#22c55e' : sale.paymentStatus === 'PARTIAL' ? '#eab308' : '#ef4444'
                    }}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td style={tdStyles}>
                    <button style={actionBtnStyles} onClick={() => setEditingSale(sale)}>Edit</button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyles, textAlign: 'center', padding: '24px' }}>No sales found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
        />
      )}

      {editingSale && (
        <EditSaleModal 
          sale={editingSale} 
          onClose={() => setEditingSale(null)} 
        />
      )}
    </div>
  );
}
