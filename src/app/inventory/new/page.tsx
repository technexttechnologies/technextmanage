export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, PackagePlus, Save, ScanBarcode } from "lucide-react";
import styles from "../page.module.css";
import { createProduct } from "../actions";

export const metadata = {
  title: "Add Inventory Item | TechNext ERP",
  description: "Create a new inventory product with pricing, barcode, and initial stock.",
};

export default function NewProductPage() {
  return (
    <div className={styles.container} style={{ maxWidth: '900px' }}>
      <header className={styles.header}>
        <div>
          <Link href="/inventory" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
          <h1 className={styles.title}>Add New Inventory Item</h1>
          <p className={styles.subtitle}>Register a new product, hardware unit, or software package into central stock.</p>
        </div>
      </header>

      <div className={styles.card} style={{ padding: '28px' }}>
        <form action={createProduct}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--brand-accent)' }}>
            1. Basic Item Identification
          </h3>
          
          <div className={styles.formGroup}>
            <label>Product / Item Name *</label>
            <input 
              type="text" 
              name="name" 
              placeholder="e.g. Aronium POS Terminal Touch 15.6, Thermal Receipt Printer 80mm" 
              className={styles.input} 
              required 
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" className={styles.select} defaultValue="Hardware">
                <option value="Hardware">Hardware & Terminals</option>
                <option value="POS & Retail">POS & Retail Peripherals</option>
                <option value="Software">Software & Reseller Licenses</option>
                <option value="Networking">Networking & Servers</option>
                <option value="Consumables">Paper & Consumables</option>
                <option value="Peripherals">Cables & Accessories</option>
                <option value="Services">Services & Maintenance</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Brand / Manufacturer</label>
              <input 
                type="text" 
                name="brand" 
                placeholder="e.g. TechNext, Epson, HP, Dell, Aronium" 
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
                placeholder="e.g. TN-POS-1001" 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Barcode / EAN</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="barcode" 
                  placeholder="Scan or enter barcode..." 
                  className={styles.input} 
                />
              </div>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Unit of Measure</label>
              <select name="unit" className={styles.select} defaultValue="Pcs">
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
                placeholder="e.g. Shelf A-04, Wayanad Warehouse, Main Desk" 
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
                placeholder="0.00" 
                className={styles.input} 
                required 
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Cost paid to distributor/supplier per unit.</span>
            </div>

            <div className={styles.formGroup}>
              <label>Selling Price / MSRP (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="sellingPrice" 
                placeholder="0.00" 
                className={styles.input} 
                required 
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Default retail rate for quotations and invoices.</span>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>HSN / SAC Code</label>
              <input 
                type="text" 
                name="hsnCode" 
                placeholder="e.g. 8471, 998313" 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Applicable GST Tax Rate (%)</label>
              <select name="taxRate" className={styles.select} defaultValue="18">
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
              <label>Initial Stock on Hand</label>
              <input 
                type="number" 
                step="any" 
                name="currentStock" 
                defaultValue="0" 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Low Stock Warning Threshold</label>
              <input 
                type="number" 
                step="any" 
                name="reorderLevel" 
                defaultValue="5" 
                className={styles.input} 
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Alerts will trigger when stock drops to or below this level.</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Item Description / Technical Specifications</label>
            <textarea 
              name="description" 
              rows={3} 
              placeholder="Add key features, warranty term, model specs, or compatibility notes..." 
              className={styles.textarea}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Link href="/inventory" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Save Product into Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
