"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  Receipt, 
  FileText, 
  ClipboardList, 
  CreditCard 
} from "lucide-react";
import styles from "../page.module.css";
import { createBillingDocument } from "../actions";

interface LineItem {
  id?: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  tax: string;
  discount: string;
  total: number;
}

export default function BillingDocumentForm({
  customers,
  products = [],
  defaultType = "invoice",
  defaultCustomerId,
}: {
  customers: any[];
  products?: any[];
  defaultType?: string;
  defaultCustomerId?: string;
}) {
  const normalizeType = (t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes("quote")) return "QUOTATION";
    if (lower.includes("order")) return "ORDER_FORM";
    if (lower.includes("pay") || lower.includes("receipt")) return "PAYMENT_RECEIPT";
    return "INVOICE";
  };

  const [documentType, setDocumentType] = useState<string>(normalizeType(defaultType));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultCustomerId || "");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Document Number generators
  const getRandomNumber = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  const [documentNumber, setDocumentNumber] = useState<string>(
    documentType === "INVOICE" ? getRandomNumber("26-200") :
    documentType === "QUOTATION" ? getRandomNumber("Q-2026") :
    documentType === "ORDER_FORM" ? getRandomNumber("ORD-2026") :
    getRandomNumber("REC-2026")
  );

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentStatus, setPaymentStatus] = useState<string>("Paid");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI PAYMENT");
  const [bankDetails, setBankDetails] = useState<string>("SOUTH INDIAN BANK\nPULPALLY");

  const [items, setItems] = useState<LineItem[]>([
    {
      name: "VERC-M-ANIM-WEBSITE DEV",
      description: "Custom responsive web development with interactive animations & CMS integration.",
      quantity: 1,
      unitPrice: 12000,
      tax: "---",
      discount: "-4500",
      total: 7500,
    }
  ]);

  const [totalDiscount, setTotalDiscount] = useState<number>(200);
  const [scopeOfWork, setScopeOfWork] = useState<string>(
    "The invoice covers the agreed website development scope, including website design, development, responsive optimization, basic functionality, deployment, and related configuration as discussed with the client."
  );
  const [paymentTermsNote, setPaymentTermsNote] = useState<string>(
    "Payment Terms: Payment is due as per the agreed quotation/payment schedule. Any additional features, revisions, third-party services, domain, hosting, or other requirements outside the agreed scope may be charged separately."
  );

  const handleTypeChange = (newType: string) => {
    setDocumentType(newType);
    if (newType === "INVOICE") setDocumentNumber(getRandomNumber("26-200"));
    else if (newType === "QUOTATION") setDocumentNumber(getRandomNumber("Q-2026"));
    else if (newType === "ORDER_FORM") setDocumentNumber(getRandomNumber("ORD-2026"));
    else if (newType === "PAYMENT_RECEIPT") setDocumentNumber(getRandomNumber("REC-2026"));
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Line item helpers
  const handleAddItem = (product?: any) => {
    if (product) {
      setItems(prev => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          description: product.description || `SKU: ${product.sku || 'N/A'} • Unit: ${product.unit || 'Pcs'}`,
          quantity: 1,
          unitPrice: product.sellingPrice || 0,
          tax: product.taxRate ? `${product.taxRate}%` : "---",
          discount: "---",
          total: product.sellingPrice || 0,
        }
      ]);
    } else {
      setItems(prev => [
        ...prev,
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          tax: "---",
          discount: "---",
          total: 0,
        }
      ]);
    }
  };

  const calculateLineTotal = (qty: number, price: number, discountStr: string) => {
    let base = qty * price;
    if (!discountStr || discountStr === "---") return base;
    const cleanDisc = discountStr.trim();
    if (cleanDisc.endsWith("%")) {
      const pct = parseFloat(cleanDisc.replace("%", "")) || 0;
      return Math.max(0, base - (base * (pct / 100)));
    }
    const flat = Math.abs(parseFloat(cleanDisc) || 0);
    return Math.max(0, base - flat);
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };

      const q = field === "quantity" ? Number(val) || 0 : Number(item.quantity) || 0;
      const p = field === "unitPrice" ? Number(val) || 0 : Number(item.unitPrice) || 0;
      const d = field === "discount" ? String(val) : String(item.discount || "");

      item.total = Number(calculateLineTotal(q, p, d).toFixed(2));
      next[index] = item;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(totalDiscount) || 0));
  const paidAmount = paymentStatus === "Paid" ? grandTotal : 0;
  const amountDue = Math.max(0, grandTotal - paidAmount);

  return (
    <form action={createBillingDocument}>
      {/* 1. Document Type Tabs */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
          Document Type *
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
          <button
            type="button"
            onClick={() => handleTypeChange("INVOICE")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: documentType === "INVOICE" ? "2px solid #4F46E5" : "1px solid var(--surface-border)",
              background: documentType === "INVOICE" ? "#EEF2FF" : "var(--surface-background)",
              color: documentType === "INVOICE" ? "#4F46E5" : "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center"
            }}
          >
            <Receipt size={18} /> Invoice Bill
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("QUOTATION")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: documentType === "QUOTATION" ? "2px solid #4F46E5" : "1px solid var(--surface-border)",
              background: documentType === "QUOTATION" ? "#EEF2FF" : "var(--surface-background)",
              color: documentType === "QUOTATION" ? "#4F46E5" : "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center"
            }}
          >
            <FileText size={18} /> Quotation
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("ORDER_FORM")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: documentType === "ORDER_FORM" ? "2px solid #4F46E5" : "1px solid var(--surface-border)",
              background: documentType === "ORDER_FORM" ? "#EEF2FF" : "var(--surface-background)",
              color: documentType === "ORDER_FORM" ? "#4F46E5" : "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center"
            }}
          >
            <ClipboardList size={18} /> Order Form
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("PAYMENT_RECEIPT")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: documentType === "PAYMENT_RECEIPT" ? "2px solid #4F46E5" : "1px solid var(--surface-border)",
              background: documentType === "PAYMENT_RECEIPT" ? "#EEF2FF" : "var(--surface-background)",
              color: documentType === "PAYMENT_RECEIPT" ? "#4F46E5" : "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center"
            }}
          >
            <CreditCard size={18} /> Payment Receipt
          </button>
        </div>
        <input type="hidden" name="documentType" value={documentType} />
      </div>

      {/* 2. Customer & Basic Metadata */}
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="customerId">Select Customer *</label>
          <select 
            id="customerId" 
            name="customerId" 
            required 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">-- Choose Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ""} - Code: TN-{c.customerNumber || c.aroniumCode || c.id.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="projectId">Related Project (Optional)</label>
          <select 
            id="projectId" 
            name="projectId"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">-- None / General Billing --</option>
            {selectedCustomer?.projects?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="documentNumber">
            {documentType === "INVOICE" ? "Invoice Number *" :
             documentType === "QUOTATION" ? "Quotation Number *" :
             documentType === "ORDER_FORM" ? "Order Number *" : "Receipt Number *"}
          </label>
          <input 
            type="text" 
            id="documentNumber" 
            name="documentNumber" 
            required 
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="date">Document Date *</label>
          <input 
            type="date" 
            id="date" 
            name="date" 
            required 
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="dueDate">
            {documentType === "QUOTATION" ? "Valid Until Date *" :
             documentType === "ORDER_FORM" ? "Delivery Due Date *" : "Payment Due Date *"}
          </label>
          <input 
            type="date" 
            id="dueDate" 
            name="dueDate" 
            required 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="paymentStatus">Payment Status</label>
          <select 
            id="paymentStatus" 
            name="paymentStatus" 
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select 
            id="paymentMethod" 
            name="paymentMethod" 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="UPI PAYMENT">UPI PAYMENT</option>
            <option value="BANK TRANSFER">BANK TRANSFER / NEFT</option>
            <option value="CASH">CASH</option>
            <option value="NET BANKING">NET BANKING</option>
            <option value="CHEQUE">CHEQUE</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="bankDetails">Bank Details</label>
          <input 
            type="text" 
            id="bankDetails" 
            name="bankDetails" 
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            placeholder="e.g. SOUTH INDIAN BANK, PULPALLY"
          />
        </div>
      </div>

      {/* 3. Line Items Table */}
      <div style={{ marginBottom: "24px", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-lg)", padding: "16px", background: "var(--surface-background)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Package size={18} color="#4F46E5" /> Line Items & Pricing Breakdown
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
              Add items from the inventory catalog with real-time stock or type custom services.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {products.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  const sel = products.find(p => p.id === e.target.value);
                  if (sel) {
                    handleAddItem(sel);
                    e.target.value = "";
                  }
                }}
                style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "6px", border: "1px solid var(--surface-border)", background: "var(--surface-card)", color: "var(--text-primary)" }}
              >
                <option value="">📦 Add from Inventory...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.currentStock} {p.unit || 'Pcs'} • ₹{p.sellingPrice})
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "8px 12px", fontSize: "13px" }}
            >
              <Plus size={14} /> Add Custom Item
            </button>
          </div>
        </div>

        {/* Table of items */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-card)", borderBottom: "1px solid var(--surface-border)", textAlign: "left" }}>
                <th style={{ padding: "8px 10px", width: "40px" }}>#</th>
                <th style={{ padding: "8px 10px" }}>Item Name & Description</th>
                <th style={{ padding: "8px 10px", width: "80px", textAlign: "center" }}>Qty</th>
                <th style={{ padding: "8px 10px", width: "110px", textAlign: "right" }}>Unit Price (₹)</th>
                <th style={{ padding: "8px 10px", width: "90px", textAlign: "center" }}>Tax</th>
                <th style={{ padding: "8px 10px", width: "110px", textAlign: "right" }}>Discount</th>
                <th style={{ padding: "8px 10px", width: "110px", textAlign: "right" }}>Total (₹)</th>
                <th style={{ padding: "8px 10px", width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--surface-card)" }}>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <input 
                      type="text" 
                      placeholder="Item name (e.g. VERC-M-ANIM-WEBSITE DEV)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      required
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--surface-border)", fontWeight: 600, marginBottom: "4px" }}
                    />
                    <input 
                      type="text" 
                      placeholder="Optional service notes / description"
                      value={item.description || ""}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--surface-border)", fontSize: "12px", color: "var(--text-muted)" }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      required
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--surface-border)", textAlign: "center" }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <input 
                      type="number" 
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                      required
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--surface-border)", textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <input 
                      type="text" 
                      placeholder="e.g. --- or 18%"
                      value={item.tax}
                      onChange={(e) => handleItemChange(idx, "tax", e.target.value)}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--surface-border)", textAlign: "center" }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <input 
                      type="text" 
                      placeholder="e.g. -4500 or 100%"
                      value={item.discount}
                      onChange={(e) => handleItemChange(idx, "discount", e.target.value)}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--surface-border)", textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>
                    ₹{item.total.toFixed(2)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer" }}
                      title="Delete item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Financial Calculation Summary */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
        <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "8px", background: "var(--surface-background)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--surface-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <span style={{ color: "var(--text-muted)" }}>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
            <span style={{ color: "var(--text-muted)" }}>Total Discount (₹):</span>
            <input 
              type="number" 
              step="0.01" 
              name="totalDiscount" 
              value={totalDiscount}
              onChange={(e) => setTotalDiscount(Number(e.target.value) || 0)}
              style={{ width: "100px", padding: "4px 8px", textAlign: "right", borderRadius: "4px", border: "1px solid var(--surface-border)" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, borderTop: "1px solid var(--surface-border)", paddingTop: "8px" }}>
            <span>Grand Total:</span>
            <span style={{ color: "#166534" }}>₹{grandTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
            <span>Paid Amount:</span>
            <span style={{ fontWeight: 600 }}>₹{paidAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
            <span>Amount Due:</span>
            <span style={{ fontWeight: 700, color: amountDue > 0 ? "#DC2626" : "inherit" }}>₹{amountDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 5. Scope of Work & Narrative */}
      <div className={styles.formGrid}>
        <div className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="scopeOfWork">Scope of Work Narrative</label>
          <textarea 
            id="scopeOfWork" 
            name="scopeOfWork" 
            rows={3} 
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="paymentTermsNote">Payment Terms & Scope Policy</label>
          <textarea 
            id="paymentTermsNote" 
            name="paymentTermsNote" 
            rows={2} 
            value={paymentTermsNote}
            onChange={(e) => setPaymentTermsNote(e.target.value)}
          />
        </div>
      </div>

      {/* Hidden inputs to pass data */}
      <input type="hidden" name="subtotal" value={subtotal.toFixed(2)} />
      <input type="hidden" name="totalAmount" value={grandTotal.toFixed(2)} />
      <input type="hidden" name="paidAmount" value={paidAmount.toFixed(2)} />
      <input type="hidden" name="amountDue" value={amountDue.toFixed(2)} />
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--surface-border)", paddingTop: "24px" }}>
        <Link href="/billing" className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Save size={16} /> Save &amp; Generate Document
        </button>
      </div>
    </form>
  );
}
