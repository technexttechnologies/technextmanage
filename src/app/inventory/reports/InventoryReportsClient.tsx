"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  ArrowLeft, 
  Download, 
  IndianRupee, 
  Package, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Printer,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import styles from "../page.module.css";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  brand: string | null;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  taxRate: number;
  location: string | null;
}

interface InventoryReportsClientProps {
  products: Product[];
  stats: {
    totalItems: number;
    totalUnits: number;
    valuationCost: number;
    valuationRetail: number;
    potentialProfit: number;
    marginPercent: string;
    lowStockCount: number;
  };
  categoryBreakdown: {
    category: string;
    count: number;
    units: number;
    costValuation: number;
    retailValuation: number;
  }[];
}

export function InventoryReportsClient({ products, stats, categoryBreakdown }: InventoryReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"valuation" | "reorder" | "categories">("valuation");

  // Reorder items
  const reorderItems = products.filter((p) => p.currentStock <= p.reorderLevel);

  const exportValuationCSV = () => {
    const headers = ["Product Name", "SKU", "Category", "Brand", "Current Stock", "Unit", "Cost Price (INR)", "Selling Price (INR)", "Total Cost Valuation (INR)", "Total Retail Valuation (INR)", "Margin %", "Location"];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku || ""}"`,
      `"${p.category || "General"}"`,
      `"${p.brand || ""}"`,
      p.currentStock,
      p.unit,
      p.purchasePrice,
      p.sellingPrice,
      (p.currentStock * p.purchasePrice).toFixed(2),
      (p.currentStock * p.sellingPrice).toFixed(2),
      p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(1) : 0,
      `"${p.location || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `technext-inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/inventory" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
          <h1 className={styles.title}>Inventory Valuation & Analytics Reports</h1>
          <p className={styles.subtitle}>
            Financial inventory asset statements, stock replenishment deficit forecasts, and category distributions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onClick={() => window.print()} 
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} /> Print Report
          </button>
          <button 
            type="button" 
            onClick={exportValuationCSV} 
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} /> Export to CSV
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
            <IndianRupee size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Inventory Asset (At Cost)</h4>
            <p>₹{stats.valuationCost.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Potential Realizable Value</h4>
            <p>₹{stats.valuationRetail.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EEF2FF', color: 'var(--brand-accent)' }}>
            <Layers size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Potential Gross Margin</h4>
            <p>₹{stats.potentialProfit.toLocaleString("en-IN")} ({stats.marginPercent}%)</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Package size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Total Stock Units</h4>
            <p>{stats.totalUnits.toLocaleString("en-IN")} across {stats.totalItems} SKUs</p>
          </div>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className={styles.controlsBar} style={{ padding: '8px 16px' }}>
        <div className={styles.filterTabs} style={{ borderTop: 'none', paddingTop: 0 }}>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "valuation" ? styles.active : ""}`}
            onClick={() => setActiveTab("valuation")}
          >
            Detailed Item Valuation
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "reorder" ? styles.active : ""}`}
            onClick={() => setActiveTab("reorder")}
          >
            Reorder & Deficit Alert ({reorderItems.length})
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "categories" ? styles.active : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Category Distribution ({categoryBreakdown.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Detailed Valuation Table */}
      {activeTab === "valuation" && (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Stock on Hand</th>
                  <th>Unit Cost</th>
                  <th>Unit Retail</th>
                  <th>Asset Value (Cost)</th>
                  <th>Retail Value</th>
                  <th>Unrealized Profit</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const costVal = p.currentStock * p.purchasePrice;
                  const retailVal = p.currentStock * p.sellingPrice;
                  const profit = retailVal - costVal;

                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/inventory/${p.id}`} className={styles.productTitle}>
                          {p.name}
                        </Link>
                        {p.sku && <span className={styles.productSku}>{p.sku}</span>}
                      </td>
                      <td>
                        <span className={styles.categoryTag}>{p.category || "General"}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {p.currentStock} {p.unit}
                      </td>
                      <td>₹{p.purchasePrice.toLocaleString("en-IN")}</td>
                      <td style={{ color: 'var(--brand-accent)' }}>₹{p.sellingPrice.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 700 }}>₹{costVal.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>₹{retailVal.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 700, color: profit >= 0 ? '#10B981' : '#DC2626' }}>
                        ₹{profit.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Reorder & Low Stock Deficit */}
      {activeTab === "reorder" && (
        <div className={styles.card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#D97706" />
              Stock Replenishment Forecast ({reorderItems.length} Items below safety threshold)
            </h3>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Safety Min Threshold</th>
                  <th>Stock Deficit</th>
                  <th>Estimated Cost to Restock</th>
                  <th>Suggested Action</th>
                </tr>
              </thead>
              <tbody>
                {reorderItems.map((p) => {
                  const deficit = Math.max(0, p.reorderLevel - p.currentStock);
                  const suggestedOrder = deficit === 0 ? p.reorderLevel : deficit * 2;
                  const estCost = suggestedOrder * p.purchasePrice;

                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/inventory/${p.id}`} className={styles.productTitle}>
                          {p.name}
                        </Link>
                        {p.sku && <div className={styles.productSku}>{p.sku}</div>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.currentStock <= 0 ? '#DC2626' : '#D97706' }}>
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td>{p.reorderLevel} {p.unit}</td>
                      <td style={{ fontWeight: 700, color: '#DC2626' }}>
                        {deficit} {p.unit}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        ₹{estCost.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <Link href={`/inventory/${p.id}`} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          Replenish Stock
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {reorderItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>All inventory items are currently above their minimum safety levels!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Category Distribution */}
      {activeTab === "categories" && (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>SKU Count</th>
                  <th>Total Units in Stock</th>
                  <th>Asset Value at Cost</th>
                  <th>Retail Potential</th>
                  <th>% of Total Stock Asset</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat) => {
                  const sharePercent = stats.valuationCost > 0 ? ((cat.costValuation / stats.valuationCost) * 100).toFixed(1) : 0;
                  return (
                    <tr key={cat.category}>
                      <td>
                        <span className={styles.categoryTag} style={{ fontSize: '13px', padding: '4px 10px' }}>
                          {cat.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{cat.count} SKUs</td>
                      <td>{cat.units} Units</td>
                      <td style={{ fontWeight: 700 }}>₹{cat.costValuation.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>₹{cat.retailValuation.toLocaleString("en-IN")}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, minWidth: '40px' }}>{sharePercent}%</span>
                          <div style={{ flex: 1, maxWidth: '100px', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${sharePercent}%`, height: '100%', background: 'var(--brand-accent)' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
