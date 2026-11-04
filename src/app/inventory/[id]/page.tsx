export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Package, 
  IndianRupee, 
  Layers, 
  History, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Barcode,
  MapPin,
  Tag
} from "lucide-react";
import styles from "../page.module.css";
import { deleteProduct } from "../actions";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.erpProduct.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: true },
        take: 30,
      },
    },
  });

  if (!product) return notFound();

  const marginPerUnit = product.sellingPrice - product.purchasePrice;
  const marginPercent = product.sellingPrice > 0 ? ((marginPerUnit / product.sellingPrice) * 100).toFixed(1) : 0;
  const stockValuationCost = product.currentStock * product.purchasePrice;
  const stockValuationRetail = product.currentStock * product.sellingPrice;

  const isOut = product.currentStock <= 0;
  const isLow = !isOut && product.currentStock <= product.reorderLevel;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/inventory" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className={styles.title}>{product.name}</h1>
            {isOut ? (
              <span className={`${styles.stockPill} ${styles.outOfStock}`}>Out of Stock</span>
            ) : isLow ? (
              <span className={`${styles.stockPill} ${styles.lowStock}`}>Low Stock Alert</span>
            ) : (
              <span className={`${styles.stockPill} ${styles.inStock}`}>In Stock</span>
            )}
          </div>
          <p className={styles.subtitle}>
            {product.category || "General"} {product.brand ? `• Brand: ${product.brand}` : ""}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/inventory/${product.id}/edit`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Edit3 size={16} /> Edit Product
          </Link>
          <form action={async () => {
            "use server";
            await deleteProduct(product.id);
          }}>
            <button 
              type="submit" 
              className="btn-secondary" 
              style={{ color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </form>
        </div>
      </header>

      {/* Financial & Stock Metrics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EEF2FF', color: 'var(--brand-accent)' }}>
            <Package size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Stock on Hand</h4>
            <p>{product.currentStock} {product.unit}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
            <IndianRupee size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Cost / Unit</h4>
            <p>₹{product.purchasePrice.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <IndianRupee size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Selling Price (MSRP)</h4>
            <p>₹{product.sellingPrice.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Layers size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Gross Margin</h4>
            <p>{marginPercent}% (₹{marginPerUnit.toLocaleString("en-IN")})</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Product Specifications Card */}
        <div className={styles.card} style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px' }}>
            Specifications & Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>SKU Code</span>
              <strong style={{ fontFamily: 'monospace' }}>{product.sku || "—"}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Barcode / EAN</span>
              <span style={{ fontFamily: 'monospace' }}>{product.barcode || "—"}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>HSN / SAC Code</span>
              <strong>{product.hsnCode || "—"}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>GST Tax Rate</span>
              <strong>0% Tax (Exempt)</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Location / Shelf</span>
              <span>{product.location ? `📍 ${product.location}` : "Not assigned"}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Minimum Reorder Level</span>
              <span>{product.reorderLevel} {product.unit}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Total Inventory Asset Value</span>
              <strong style={{ color: 'var(--brand-accent)' }}>₹{stockValuationCost.toLocaleString("en-IN")}</strong>
            </div>

            {product.description && (
              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '12px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Description</span>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stock Audit Movement Ledger */}
        <div className={styles.card}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--brand-accent)' }} />
              Stock Movement & Audit History
            </h3>
            <span className={styles.tabBadge}>{product.stockMovements.length} Records</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action Type</th>
                  <th>Change Qty</th>
                  <th>Resulting Stock</th>
                  <th>Reason / Ref</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {product.stockMovements.map((m) => {
                  const isPositive = m.type === "IN";
                  return (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(m.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span className={styles.categoryTag} style={{
                          background: m.type === "IN" ? "#DCFCE7" : m.type === "DAMAGE" ? "#FEE2E2" : "#F1F5F9",
                          color: m.type === "IN" ? "#166534" : m.type === "DAMAGE" ? "#991B1B" : "#334155",
                        }}>
                          {m.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isPositive ? "#16A34A" : "#DC2626" }}>
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`} {product.unit}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {m.newStock} {product.unit}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div>{m.reason || "Manual update"}</div>
                        {m.referenceNo && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Ref: {m.referenceNo}</span>}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {m.createdBy?.name || "System"}
                      </td>
                    </tr>
                  );
                })}

                {product.stockMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      No stock movement history recorded for this item yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
