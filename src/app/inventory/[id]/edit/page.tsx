export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import styles from "../../page.module.css";
import { updateProduct } from "../../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.erpProduct.findUnique({
    where: { id },
  });

  if (!product) return notFound();

  return (
    <div className={styles.container} style={{ maxWidth: '900px' }}>
      <header className={styles.header}>
        <div>
          <Link href={`/inventory/${product.id}`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <h1 className={styles.title}>Edit Product: {product.name}</h1>
          <p className={styles.subtitle}>Modify product catalog details, selling price, and inventory alert thresholds.</p>
        </div>
      </header>

      <div className={styles.card} style={{ padding: '28px' }}>
        <form action={updateProduct}>
          <input type="hidden" name="id" value={product.id} />

          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--brand-accent)' }}>
            1. Basic Item Identification
          </h3>
          
          <div className={styles.formGroup}>
            <label>Product / Item Name *</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={product.name}
              className={styles.input} 
              required 
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" className={styles.select} defaultValue={product.category || "Hardware"}>
                <option value="Hardware">Hardware & Terminals</option>
                <option value="POS & Retail">POS & Retail Peripherals</option>
                <option value="Software">Software & Reseller Licenses</option>
                <option value="Networking">Networking & Servers</option>
                <option value="Consumables">Paper & Consumables</option>
                <option value="Peripherals">Cables & Accessories</option>
                <option value="Services">Services & Maintenance</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Brand / Manufacturer</label>
              <input 
                type="text" 
                name="brand" 
                defaultValue={product.brand || ""} 
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>SKU (Stock Keeping Unit)</label>
              <input 
                type="text" 
                name="sku" 
                defaultValue={product.sku || ""} 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Barcode / EAN</label>
              <input 
                type="text" 
                name="barcode" 
                defaultValue={product.barcode || ""} 
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Unit of Measure</label>
              <select name="unit" className={styles.select} defaultValue={product.unit || "Pcs"}>
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Nos">Nos (Numbers)</option>
                <option value="Box">Box</option>
                <option value="Set">Set</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Meter">Meter</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Warehouse / Shelf Location</label>
              <input 
                type="text" 
                name="location" 
                defaultValue={product.location || ""} 
                className={styles.input} 
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '24px 0' }} />

          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--brand-accent)' }}>
            2. Pricing, Tax & Valuation
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Purchase Cost Price (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="purchasePrice" 
                defaultValue={product.purchasePrice} 
                className={styles.input} 
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Selling Price / MSRP (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="sellingPrice" 
                defaultValue={product.sellingPrice} 
                className={styles.input} 
                required 
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>HSN / SAC Code</label>
              <input 
                type="text" 
                name="hsnCode" 
                defaultValue={product.hsnCode || ""} 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Applicable GST Tax Rate (%)</label>
              <select name="taxRate" className={styles.select} defaultValue={product.taxRate || 18}>
                <option value="0">0% (Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard IT Hardware)</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '24px 0' }} />

          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--brand-accent)' }}>
            3. Stock Quantities & Alert Thresholds
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Current Stock (Read Only - use Quick Adjust to change)</label>
              <input 
                type="text" 
                disabled 
                value={`${product.currentStock} ${product.unit}`} 
                className={styles.input} 
                style={{ background: '#F1F5F9', color: '#64748B' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Low Stock Warning Threshold</label>
              <input 
                type="number" 
                step="any" 
                name="reorderLevel" 
                defaultValue={product.reorderLevel} 
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Item Description / Technical Specifications</label>
            <textarea 
              name="description" 
              rows={3} 
              defaultValue={product.description || ""} 
              className={styles.textarea}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Link href={`/inventory/${product.id}`} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Save Product Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
