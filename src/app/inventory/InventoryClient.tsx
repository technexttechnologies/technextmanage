"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  FileText, 
  BarChart3, 
  History,
  X,
  IndianRupee,
  Layers,
  ArrowRight
} from "lucide-react";
import styles from "./page.module.css";
import { adjustStock } from "./actions";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  unit: string;
  hsnCode: string | null;
  taxRate: number;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  isLowStock: boolean;
  isService?: boolean;
  productType?: string;
  location: string | null;
}

interface InventoryClientProps {
  products: Product[];
  stats: {
    totalItems: number;
    totalUnits: number;
    valuationCost: number;
    valuationRetail: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categories: string[];
}

export function InventoryClient({ products, stats, categories }: InventoryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "SERVICES">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  // Stock adjustment modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<"IN" | "OUT" | "ADJUSTMENT" | "DAMAGE">("IN");
  const [adjQty, setAdjQty] = useState<number>(1);
  const [adjReason, setAdjReason] = useState("");
  const [isAdjusting, startAdjusting] = useTransition();
  const [adjustMessage, setAdjustMessage] = useState<{ success?: boolean; text?: string } | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.brand && p.brand.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    // Category
    if (categoryFilter !== "ALL" && p.category !== categoryFilter) {
      return false;
    }

    // Status Tab
    const isSrv = p.isService || p.productType === "SERVICE";
    if (statusFilter === "SERVICES") {
      return isSrv;
    }
    if (statusFilter === "IN_STOCK") {
      return isSrv || p.currentStock > p.reorderLevel;
    }
    if (statusFilter === "LOW_STOCK") {
      return !isSrv && p.currentStock > 0 && p.currentStock <= p.reorderLevel;
    }
    if (statusFilter === "OUT_OF_STOCK") {
      return !isSrv && p.currentStock <= 0;
    }

    return true;
  });

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    setAdjustMessage(null);
    startAdjusting(async () => {
      try {
        await adjustStock(adjustingProduct.id, adjType, adjQty, adjReason);
        setAdjustMessage({ success: true, text: "Stock updated successfully!" });
        setTimeout(() => {
          setAdjustingProduct(null);
          setAdjustMessage(null);
          setAdjQty(1);
          setAdjReason("");
        }, 1200);
      } catch (err: any) {
        setAdjustMessage({ success: false, text: err?.message || "Failed to adjust stock." });
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory & Stock Management</h1>
          <p className={styles.subtitle}>
            Track real-time stock levels, valuations, reorder alerts, and audit movements for TechNext hardware and digital products.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/inventory/reports" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} /> Inventory Reports
          </Link>
          <Link href="/inventory/movements" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <History size={16} /> Audit Movements
          </Link>
          <Link href="/inventory/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> Add New Item
          </Link>
        </div>
      </header>

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EEF2FF', color: 'var(--brand-accent)' }}>
            <Package size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Total Products / SKUs</h4>
            <p>{stats.totalItems}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
            <IndianRupee size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Inventory Value (Cost)</h4>
            <p>₹{stats.valuationCost.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Layers size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Retail Valuation</h4>
            <p>₹{stats.valuationRetail.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ 
            background: stats.lowStockCount > 0 ? '#FEF3C7' : '#F1F5F9', 
            color: stats.lowStockCount > 0 ? '#D97706' : '#64748B' 
          }}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Low / Out of Stock</h4>
            <p style={{ color: stats.lowStockCount > 0 ? '#D97706' : 'var(--text-primary)' }}>
              {stats.lowStockCount + stats.outOfStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchAndFilters}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by product name, SKU, barcode, brand, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterTabs}>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${statusFilter === "ALL" ? styles.active : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All Stock <span className={styles.tabBadge}>{products.length}</span>
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${statusFilter === "IN_STOCK" ? styles.active : ""}`}
            onClick={() => setStatusFilter("IN_STOCK")}
          >
            <CheckCircle2 size={13} color={statusFilter === "IN_STOCK" ? "#FFF" : "#10B981"} /> In Stock
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${statusFilter === "LOW_STOCK" ? styles.active : ""}`}
            onClick={() => setStatusFilter("LOW_STOCK")}
          >
            <AlertTriangle size={13} color={statusFilter === "LOW_STOCK" ? "#FFF" : "#F59E0B"} /> Low Stock Alert 
            {stats.lowStockCount > 0 && <span className={styles.tabBadge}>{stats.lowStockCount}</span>}
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${statusFilter === "OUT_OF_STOCK" ? styles.active : ""}`}
            onClick={() => setStatusFilter("OUT_OF_STOCK")}
          >
            <XCircle size={13} color={statusFilter === "OUT_OF_STOCK" ? "#FFF" : "#EF4444"} /> Out of Stock
            {stats.outOfStockCount > 0 && <span className={styles.tabBadge}>{stats.outOfStockCount}</span>}
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${statusFilter === "SERVICES" ? styles.active : ""}`}
            onClick={() => setStatusFilter("SERVICES")}
          >
            Services ({products.filter(p => p.isService || p.productType === "SERVICE").length})
          </button>
        </div>
      </div>

      {/* Products Inventory Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item &amp; SKU</th>
                <th>Category / Brand</th>
                <th>Current Stock</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Margin</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isSrv = p.isService || p.productType === "SERVICE";
                const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0) : 0;
                const isOut = !isSrv && p.currentStock <= 0;
                const isLow = !isSrv && !isOut && p.currentStock <= p.reorderLevel;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.productNameCell}>
                        <Link href={`/inventory/${p.id}`} className={styles.productTitle}>
                          {p.name}
                        </Link>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isSrv && <span style={{ fontSize: '11px', background: '#EEF2FF', color: '#4F46E5', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>SERVICE</span>}
                          {p.sku && <span className={styles.productSku}>SKU: {p.sku}</span>}
                          {p.barcode && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BAR: {p.barcode}</span>}
                          {p.location && <span style={{ fontSize: '11px', color: '#6366F1' }}>{p.location}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className={styles.categoryTag}>{p.category || "General"}</span>
                        {p.brand && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.brand}</span>}
                      </div>
                    </td>
                    <td>
                      {isSrv ? (
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5' }}>Non-inventory</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per {p.unit || 'Service'}</div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: isOut ? '#DC2626' : isLow ? '#D97706' : 'var(--text-primary)' }}>
                              {p.currentStock}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.unit}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Min alert: {p.reorderLevel} {p.unit}
                          </span>
                        </>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{p.purchasePrice.toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>₹{p.sellingPrice.toLocaleString("en-IN")}</td>
                    <td>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: Number(margin) >= 20 ? '#10B981' : Number(margin) > 0 ? '#F59E0B' : '#DC2626' 
                      }}>
                        {margin}%
                      </span>
                    </td>
                    <td>
                      {isSrv ? (
                        <span className={styles.stockPill} style={{ background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }}>
                          Service
                        </span>
                      ) : isOut ? (
                        <span className={`${styles.stockPill} ${styles.outOfStock}`}>Out of Stock</span>
                      ) : isLow ? (
                        <span className={`${styles.stockPill} ${styles.lowStock}`}>Low Stock</span>
                      ) : (
                        <span className={`${styles.stockPill} ${styles.inStock}`}>In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionBtnGroup}>
                        <button 
                          type="button" 
                          onClick={() => setAdjustingProduct(p)} 
                          className={styles.iconBtn}
                          title="Adjust Stock Quantity"
                        >
                          <ArrowUpDown size={15} />
                        </button>
                        <Link href={`/inventory/${p.id}`} className={styles.iconBtn} title="View Details">
                          <Eye size={15} />
                        </Link>
                        <Link href={`/inventory/${p.id}/edit`} className={styles.iconBtn} title="Edit Product">
                          <Edit3 size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>No inventory items found</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your search criteria or add your first inventory product.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Quick Stock Adjustment</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {adjustingProduct.name} (Current: <strong>{adjustingProduct.currentStock} {adjustingProduct.unit}</strong>)
                </p>
              </div>
              <button type="button" onClick={() => setAdjustingProduct(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit}>
              <div className={styles.formGroup}>
                <label>Adjustment Type</label>
                <select 
                  value={adjType} 
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="IN">Restock / Purchase Received (+ IN)</option>
                  <option value="OUT">Sale Dispatched / Customer Order (- OUT)</option>
                  <option value="DAMAGE">Damaged / Scrapped / Defective (- DAMAGE)</option>
                  <option value="ADJUSTMENT">Manual Count Correction (Direct Set)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  {adjType === "ADJUSTMENT" ? "New Exact Stock Quantity" : "Quantity to Adjust"} ({adjustingProduct.unit})
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0" 
                  required 
                  value={adjQty}
                  onChange={(e) => setAdjQty(parseFloat(e.target.value) || 0)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Reason / Audit Note</label>
                <input 
                  type="text" 
                  placeholder="e.g. Supplier PO #4092, damaged box during transit, audit correction"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              {adjustMessage && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '14px',
                  background: adjustMessage.success ? '#DCFCE7' : '#FEE2E2',
                  color: adjustMessage.success ? '#166534' : '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {adjustMessage.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {adjustMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setAdjustingProduct(null)} 
                  className="btn-secondary"
                  disabled={isAdjusting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isAdjusting || adjQty <= 0}
                >
                  {isAdjusting ? "Updating..." : "Save Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
