"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Package, Wrench, ArrowLeft } from "lucide-react";
import styles from "@/app/inventory/page.module.css";
import { createProduct, updateProduct } from "@/app/inventory/actions";

interface Props {
  initialData?: any;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit = false }: Props) {
  const [productType, setProductType] = useState<"PHYSICAL" | "SERVICE">(
    initialData?.productType || (initialData?.isService ? "SERVICE" : "PHYSICAL")
  );

  const isService = productType === "SERVICE";

  return (
    <form action={isEdit ? updateProduct : createProduct}>
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="productType" value={productType} />
      <input type="hidden" name="isService" value={isService ? "true" : "false"} />

      {/* Product Type Selector Tabs */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
          Item Classification *
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "600px" }}>
          <button
            type="button"
            onClick={() => setProductType("PHYSICAL")}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              border: !isService ? "2px solid #4F46E5" : "1px solid var(--surface-border)",
              background: !isService ? "#EEF2FF" : "var(--surface-background)",
              color: !isService ? "#4F46E5" : "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <Package size={18} /> Physical Goods / Hardware
          </button>

          <button
            type="button"
            onClick={() => setProductType("SERVICE")}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              border: isService ? "2px solid #4F46E5" : "1px solid var(--surface-border)",
              background: isService ? "#EEF2FF" : "var(--surface-background)",
              color: isService ? "#4F46E5" : "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <Wrench size={18} /> Service / Maintenance / Labor
          </button>
        </div>
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--brand-accent)" }}>
        1. Item Identification &amp; Category
      </h3>

      <div className={styles.formGroup}>
        <label>{isService ? "Service / Package Name *" : "Product / Hardware Name *"}</label>
        <input
          type="text"
          name="name"
          defaultValue={initialData?.name || ""}
          placeholder={isService ? "e.g. Website Development Standard, Annual Maintenance Contract (AMC), On-site IT Support" : "e.g. Thermal Receipt Printer 80mm, Aronium Touch POS Terminal 15.6"}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Category</label>
          <select
            name="category"
            className={styles.select}
            defaultValue={initialData?.category || (isService ? "Services" : "Hardware")}
          >
            {isService ? (
              <>
                <option value="Services & Maintenance">Services &amp; Maintenance</option>
                <option value="Web & Software Dev">Web &amp; Software Dev</option>
                <option value="AMC & Support">AMC &amp; Support</option>
                <option value="Consulting & Setup">Consulting &amp; Setup</option>
                <option value="Digital Marketing">Digital Marketing &amp; SEO</option>
                <option value="General Service">General Service</option>
              </>
            ) : (
              <>
                <option value="Hardware">Hardware &amp; Terminals</option>
                <option value="POS & Retail">POS &amp; Retail Peripherals</option>
                <option value="Software">Software &amp; Reseller Licenses</option>
                <option value="Networking">Networking &amp; Servers</option>
                <option value="Consumables">Paper &amp; Consumables</option>
                <option value="Peripherals">Cables &amp; Accessories</option>
                <option value="General">General</option>
              </>
            )}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{isService ? "Provider / Division" : "Brand / Manufacturer"}</label>
          <input
            type="text"
            name="brand"
            defaultValue={initialData?.brand || (isService ? "TechNext" : "")}
            placeholder="e.g. TechNext, Epson, HP, Dell"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>SKU (Item Code)</label>
          <input
            type="text"
            name="sku"
            defaultValue={initialData?.sku || ""}
            placeholder={isService ? "e.g. TN-SRV-WEBDEV" : "e.g. TN-POS-1001"}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{isService ? "Service Reference Code" : "Barcode / EAN"}</label>
          <input
            type="text"
            name="barcode"
            defaultValue={initialData?.barcode || ""}
            placeholder={isService ? "Optional reference ID" : "e.g. 8901234567890"}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Unit of Measure</label>
          <select
            name="unit"
            className={styles.select}
            defaultValue={initialData?.unit || (isService ? "Service" : "Pcs")}
          >
            {isService ? (
              <>
                <option value="Service">Service</option>
                <option value="Year">Year (Annual)</option>
                <option value="Month">Month (Recurring)</option>
                <option value="Project">Project</option>
                <option value="Hour">Hour</option>
                <option value="Session">Session</option>
                <option value="Pcs">Pcs</option>
              </>
            ) : (
              <>
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Nos">Nos (Numbers)</option>
                <option value="Box">Box</option>
                <option value="Set">Set</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Meter">Meter</option>
              </>
            )}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{isService ? "Service Location / Remote" : "Warehouse / Shelf Location"}</label>
          <input
            type="text"
            name="location"
            defaultValue={initialData?.location || (isService ? "Remote / On-site" : "")}
            placeholder={isService ? "e.g. Remote, On-site, Pulpally Lab" : "e.g. Rack A-3, Shelf 2"}
            className={styles.input}
          />
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--surface-border)", margin: "24px 0" }} />

      <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--brand-accent)" }}>
        2. Pricing, Tax &amp; GST Details
      </h3>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{isService ? "Base Cost / Labor Cost (₹) *" : "Purchase Cost Price (₹) *"}</label>
          <input
            type="number"
            step="0.01"
            name="purchasePrice"
            defaultValue={initialData?.purchasePrice ?? 0}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>{isService ? "Billing Rate / Fee (₹) *" : "Selling Price / MSRP (₹) *"}</label>
          <input
            type="number"
            step="0.01"
            name="sellingPrice"
            defaultValue={initialData?.sellingPrice ?? 0}
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{isService ? "SAC Code (Services Accounting Code)" : "HSN Code (Goods)"}</label>
          <input
            type="text"
            name="hsnCode"
            defaultValue={initialData?.hsnCode || (isService ? "998314" : "")}
            placeholder={isService ? "e.g. 998314 (IT Design & Development)" : "e.g. 844332 (Printers)"}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Applicable GST Tax Rate (%)</label>
          <select
            name="taxRate"
            className={styles.select}
            defaultValue={initialData?.taxRate ?? 18}
          >
            <option value="0">0% (Exempt)</option>
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% GST (Standard Services / IT)</option>
            <option value="28">28% GST</option>
          </select>
        </div>
      </div>

      {/* 3. Stock Tracking (Physical only) */}
      {!isService ? (
        <>
          <hr style={{ border: "none", borderTop: "1px solid var(--surface-border)", margin: "24px 0" }} />

          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--brand-accent)" }}>
            3. Stock Quantities &amp; Alert Thresholds
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{isEdit ? "Current Stock (Read Only - use Quick Adjust to change)" : "Initial Stock Quantity"}</label>
              <input
                type={isEdit ? "text" : "number"}
                step="any"
                name="currentStock"
                defaultValue={initialData?.currentStock ?? 0}
                disabled={isEdit}
                className={styles.input}
                style={isEdit ? { background: "#F1F5F9", color: "#64748B" } : {}}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Low Stock Warning Threshold</label>
              <input
                type="number"
                step="any"
                name="reorderLevel"
                defaultValue={initialData?.reorderLevel ?? 5}
                className={styles.input}
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginTop: "20px", padding: "16px", background: "#EEF2FF", border: "1px dashed #A5B4FC", borderRadius: "8px", color: "#3730A3", fontSize: "13px" }}>
          ℹ️ <strong>Service Product Notice:</strong> Services are non-inventory intangibles. Stock depletion and low-stock alerts are automatically skipped during billing.
        </div>
      )}

      <div className={styles.formGroup} style={{ marginTop: "20px" }}>
        <label>{isService ? "Service Deliverables & Scope Details" : "Item Description / Technical Specifications"}</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={initialData?.description || ""}
          placeholder={isService ? "e.g. Scope includes custom responsive UI, admin portal, domain, SSL, and 1-year hosting." : "e.g. 80mm thermal receipt printer with USB and Ethernet connectivity."}
          className={styles.textarea}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px", borderTop: "1px solid var(--surface-border)", paddingTop: "20px" }}>
        <Link href={isEdit ? `/inventory/${initialData.id}` : "/inventory"} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" style={{ padding: "10px 24px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <Save size={16} /> {isEdit ? "Save Product Changes" : "Create Item"}
        </button>
      </div>
    </form>
  );
}
