"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Plus, Trash2, Package } from "lucide-react";
import styles from "../page.module.css";
import { createInvoiceRequest } from "../actions";

interface LineItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function InvoiceRequestForm({ 
  customers, 
  products = [] 
}: { 
  customers: any[]; 
  products?: any[]; 
}) {
  const [items, setItems] = useState<LineItem[]>([]);
  const [manualSubtotal, setManualSubtotal] = useState<string>("");
  const [manualNotes, setManualNotes] = useState<string>("");

  const handleAddItem = (product?: any) => {
    if (product) {
      setItems(prev => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.sellingPrice || 0,
          total: product.sellingPrice || 0,
        }
      ]);
    } else {
      setItems(prev => [
        ...prev,
        {
          name: "",
          quantity: 1,
          price: 0,
          total: 0,
        }
      ]);
    }
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };
      if (field === "quantity" || field === "price") {
        const q = field === "quantity" ? Number(val) || 0 : Number(item.quantity) || 0;
        const p = field === "price" ? Number(val) || 0 : Number(item.price) || 0;
        item.total = Number((q * p).toFixed(2));
      }
      next[index] = item;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculatedSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const activeSubtotal = items.length > 0 ? calculatedSubtotal.toFixed(2) : manualSubtotal;
  const activeTotalDisplay = activeSubtotal ? parseFloat(activeSubtotal).toFixed(2) : "0.00";

  // Auto-compose notes if items are present, or use manual notes
  const compiledNotes = items.length > 0
    ? items.map(it => `• ${it.name} (Qty: ${it.quantity} @ ₹${it.price} = ₹${it.total.toFixed(2)})`).join("\n") + (manualNotes ? `\n\nNotes: ${manualNotes}` : "")
    : manualNotes;

  return (
    <form action={createInvoiceRequest}>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="customerId">Select Customer *</label>
          <select id="customerId" name="customerId" required>
            <option value="">-- Choose a Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="projectId">Related Project (Optional)</label>
          <select id="projectId" name="projectId">
            <option value="">-- General Invoice (No Project) --</option>
            {customers.flatMap(c => c.projects || []).map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Items & Inventory Section */}
      <div style={{ marginBottom: "24px", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-lg)", padding: "16px", background: "var(--surface-background)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Package size={18} color="#4F46E5" /> Invoice Line Items & Inventory
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
              Select products from inventory to track stock or add custom service items.
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

        {items.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", border: "1px dashed var(--surface-border)", borderRadius: "6px" }}>
            No line items added yet. Click &quot;Add from Inventory&quot; to link products or &quot;Add Custom Item&quot; to build the breakdown.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "3fr 1fr 1.5fr 1.5fr auto", 
                  gap: "10px", 
                  alignItems: "center",
                  background: "var(--surface-card)",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--surface-border)"
                }}
              >
                <input
                  type="text"
                  placeholder="Item / Service description"
                  value={item.name}
                  onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                  required
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "13px" }}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                  required
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "13px" }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price (₹)"
                  value={item.price}
                  onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                  required
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "13px" }}
                />
                <div style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text-primary)", fontSize: "13px", textAlign: "right" }}>
                  ₹{item.total.toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer", padding: "4px" }}
                  title="Remove Item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="subtotal">Subtotal (₹) *</label>
          <input 
            type="number" 
            step="0.01" 
            id="subtotal" 
            name="subtotal" 
            required 
            placeholder="e.g. 1000.00"
            value={activeSubtotal}
            onChange={(e) => setManualSubtotal(e.target.value)}
            readOnly={items.length > 0}
            style={items.length > 0 ? { backgroundColor: "var(--background)", cursor: "not-allowed", fontWeight: 600 } : {}}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Total Amount (₹)</label>
          <input 
            type="text" 
            disabled 
            value={`₹${activeTotalDisplay}`} 
            style={{ fontWeight: "bold", backgroundColor: "var(--background)", cursor: "not-allowed" }}
          />
          <input type="hidden" name="amountRequested" value={activeTotalDisplay} />
        </div>

        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="notes">Invoice Details & Line Items *</label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={5} 
            required 
            placeholder="List exactly what should be on the invoice. E.g. '1x Web Development - ₹80000, 1x Hosting - ₹40000'"
            value={compiledNotes}
            onChange={(e) => setManualNotes(e.target.value)}
          />
          <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--surface-border)', paddingTop: '24px' }}>
        <Link href="/invoice-requests" className="btn-secondary">Cancel</Link>
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={16} /> Submit Request
        </button>
      </div>
    </form>
  );
}
