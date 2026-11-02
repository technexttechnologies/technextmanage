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
  CreditCard, 
  UserPlus, 
  Check, 
  X, 
  Loader2, 
  Layers, 
  Calendar 
} from "lucide-react";
import styles from "../page.module.css";
import { 
  createBillingDocument, 
  updateBillingDocument, 
  quickCreateBillingCustomer 
} from "../actions";

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
  customers = [],
  products = [],
  defaultType = "invoice",
  defaultCustomerId,
  initialDocument,
  isEdit = false,
}: {
  customers: any[];
  products?: any[];
  defaultType?: string;
  defaultCustomerId?: string;
  initialDocument?: any;
  isEdit?: boolean;
}) {
  const normalizeType = (t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes("quote")) return "QUOTATION";
    if (lower.includes("order")) return "ORDER_FORM";
    if (lower.includes("pay") || lower.includes("receipt")) return "PAYMENT_RECEIPT";
    return "INVOICE";
  };

  const [customerList, setCustomerList] = useState<any[]>(customers);
  const [documentType, setDocumentType] = useState<string>(
    initialDocument?.documentType ? normalizeType(initialDocument.documentType) : normalizeType(defaultType)
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialDocument?.customerId || defaultCustomerId || (customers[0]?.id || "")
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialDocument?.projectId || ""
  );

  // Document Number generators
  const getRandomNumber = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  const [documentNumber, setDocumentNumber] = useState<string>(
    initialDocument?.documentNumber ||
    initialDocument?.aroniumInvoiceNo ||
    initialDocument?.quotationNumber ||
    (documentType === "INVOICE" ? getRandomNumber("26-200") :
     documentType === "QUOTATION" ? getRandomNumber("Q-2026") :
     documentType === "ORDER_FORM" ? getRandomNumber("ORD-2026") :
     getRandomNumber("REC-2026"))
  );

  const [date, setDate] = useState<string>(
    initialDocument?.date ? new Date(initialDocument.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    initialDocument?.dueDate ? new Date(initialDocument.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  // Payment Mode: FULL, SPLIT, or CREDIT
  const [paymentType, setPaymentType] = useState<"FULL" | "SPLIT" | "CREDIT">(
    initialDocument?.paymentType || (initialDocument?.paymentMethod?.includes("SPLIT") ? "SPLIT" : initialDocument?.paymentMethod?.includes("CREDIT") ? "CREDIT" : "FULL")
  );

  const [paymentStatus, setPaymentStatus] = useState<string>(
    initialDocument?.paymentStatus || "Paid"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialDocument?.paymentMethod || "UPI PAYMENT"
  );
  const [bankDetails, setBankDetails] = useState<string>(
    initialDocument?.bankDetails || "SOUTH INDIAN BANK\nPULPALLY"
  );

  // Split payment breakdown state
  const [splitCash, setSplitCash] = useState<number>(initialDocument?.splitBreakdown?.cash || 0);
  const [splitUpi, setSplitUpi] = useState<number>(initialDocument?.splitBreakdown?.upi || 0);
  const [splitBank, setSplitBank] = useState<number>(initialDocument?.splitBreakdown?.bank || 0);
  const [splitCheque, setSplitCheque] = useState<number>(initialDocument?.splitBreakdown?.cheque || 0);

  // Credit terms state
  const [creditDueDate, setCreditDueDate] = useState<string>(
    initialDocument?.creditDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [creditTerms, setCreditTerms] = useState<string>(
    initialDocument?.creditTerms || "Net 30 Days"
  );

  // Line items
  const [items, setItems] = useState<LineItem[]>(
    initialDocument?.items?.length > 0
      ? initialDocument.items
      : [
          {
            name: "VERC-M-ANIM-WEBSITE DEV",
            description: "Custom responsive web development with interactive animations & CMS integration.",
            quantity: 1,
            unitPrice: 12000,
            tax: "---",
            discount: "-4500",
            total: 7500,
          }
        ]
  );

  const [totalDiscount, setTotalDiscount] = useState<number>(initialDocument?.totalDiscount ?? 200);
  const [scopeOfWork, setScopeOfWork] = useState<string>(
    initialDocument?.scopeOfWork ||
    initialDocument?.notes ||
    "The invoice covers the agreed website development scope, including website design, development, responsive optimization, basic functionality, deployment, and related configuration as discussed with the client."
  );
  const [paymentTermsNote, setPaymentTermsNote] = useState<string>(
    initialDocument?.paymentTermsNote ||
    "Payment Terms: Payment is due as per the agreed quotation/payment schedule. Any additional features, revisions, third-party services, domain, hosting, or other requirements outside the agreed scope may be charged separately."
  );

  // Quick Customer Creation Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustGst, setNewCustGst] = useState("");
  const [isCreatingCust, setIsCreatingCust] = useState(false);
  const [custModalError, setCustModalError] = useState("");

  const handleTypeChange = (newType: string) => {
    setDocumentType(newType);
    if (!isEdit) {
      if (newType === "INVOICE") setDocumentNumber(getRandomNumber("26-200"));
      else if (newType === "QUOTATION") setDocumentNumber(getRandomNumber("Q-2026"));
      else if (newType === "ORDER_FORM") setDocumentNumber(getRandomNumber("ORD-2026"));
      else if (newType === "PAYMENT_RECEIPT") setDocumentNumber(getRandomNumber("REC-2026"));
    }
  };

  const selectedCustomer = customerList.find(c => c.id === selectedCustomerId);

  // Quick Customer Creation Handler
  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setCustModalError("Client name is required");
      return;
    }
    setIsCreatingCust(true);
    setCustModalError("");

    try {
      const res = await quickCreateBillingCustomer({
        name: newCustName,
        company: newCustCompany,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
        gstNumber: newCustGst,
      });

      if (res.success && res.customer) {
        setCustomerList(prev => [res.customer, ...prev]);
        setSelectedCustomerId(res.customer.id);
        setShowAddCustomerModal(false);
        // Reset modal fields
        setNewCustName("");
        setNewCustCompany("");
        setNewCustPhone("");
        setNewCustEmail("");
        setNewCustAddress("");
        setNewCustGst("");
      }
    } catch (err: any) {
      setCustModalError(err.message || "Failed to create client");
    } finally {
      setIsCreatingCust(false);
    }
  };

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

  // Compute payment reconciliation
  const splitSum = (Number(splitCash) || 0) + (Number(splitUpi) || 0) + (Number(splitBank) || 0) + (Number(splitCheque) || 0);
  let effectivePaid = 0;
  let effectiveDue = grandTotal;

  if (paymentType === "CREDIT") {
    effectivePaid = 0;
    effectiveDue = grandTotal;
  } else if (paymentType === "SPLIT") {
    effectivePaid = splitSum;
    effectiveDue = Math.max(0, grandTotal - splitSum);
  } else {
    // FULL
    effectivePaid = paymentStatus === "Paid" ? grandTotal : 0;
    effectiveDue = Math.max(0, grandTotal - effectivePaid);
  }

  return (
    <>
      <form action={isEdit ? updateBillingDocument : createBillingDocument}>
        {isEdit && <input type="hidden" name="id" value={initialDocument.id} />}
        <input type="hidden" name="documentType" value={documentType} />
        <input type="hidden" name="paymentType" value={paymentType} />

        {/* 1. Document Type Tabs */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
            Document Classification *
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
                justifyContent: "center",
                transition: "all 0.15s ease",
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
                justifyContent: "center",
                transition: "all 0.15s ease",
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
                justifyContent: "center",
                transition: "all 0.15s ease",
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
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <CreditCard size={18} /> Payment Receipt
            </button>
          </div>
        </div>

        {/* 2. Customer Selector with Quick Add */}
        <div className={styles.formGrid}>
          <div className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label htmlFor="customerId">Select Customer / Client *</label>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#4F46E5",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}
              >
                <UserPlus size={15} /> + Add New Customer While Billing
              </button>
            </div>
            <select 
              id="customerId" 
              name="customerId" 
              required 
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Choose Customer --</option>
              {customerList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""} - Code: TN-{c.customerNumber || c.aroniumCode || c.id.slice(-4)}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <span>Phone: <strong>{selectedCustomer.phone || "---"}</strong></span>
                <span>Email: <strong>{selectedCustomer.email || "---"}</strong></span>
                <span>Code: <strong>TN-{selectedCustomer.customerNumber || selectedCustomer.aroniumCode || selectedCustomer.id.slice(-4)}</strong></span>
                {selectedCustomer.address && <span>Address: <strong>{selectedCustomer.address}</strong></span>}
              </div>
            )}
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
        </div>

        {/* 3. Payment Mode & Split / Credit Controls */}
        <div style={{ marginBottom: "24px", padding: "18px", background: "var(--surface-background)", borderRadius: "var(--radius-lg)", border: "1px solid var(--surface-border)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0" }}>
            <CreditCard size={18} color="#4F46E5" /> Payment Method &amp; Credit Terms
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => {
                setPaymentType("FULL");
                setPaymentStatus("Paid");
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                border: paymentType === "FULL" ? "2px solid #10B981" : "1px solid var(--surface-border)",
                background: paymentType === "FULL" ? "#ECFDF5" : "var(--surface-card)",
                color: paymentType === "FULL" ? "#065F46" : "var(--text-primary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                justifyContent: "center"
              }}
            >
              <Check size={16} /> Single / Full Payment
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("SPLIT")}
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                border: paymentType === "SPLIT" ? "2px solid #6366F1" : "1px solid var(--surface-border)",
                background: paymentType === "SPLIT" ? "#EEF2FF" : "var(--surface-card)",
                color: paymentType === "SPLIT" ? "#3730A3" : "var(--text-primary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                justifyContent: "center"
              }}
            >
              <Layers size={16} /> Split Payment (Multi-Tender)
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentType("CREDIT");
                setPaymentStatus("Credit / Due");
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                border: paymentType === "CREDIT" ? "2px solid #F59E0B" : "1px solid var(--surface-border)",
                background: paymentType === "CREDIT" ? "#FEF3C7" : "var(--surface-card)",
                color: paymentType === "CREDIT" ? "#92400E" : "var(--text-primary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                justifyContent: "center"
              }}
            >
              <Calendar size={16} /> Credit / Khata (Pay Later)
            </button>
          </div>

          {/* Conditional Rendering based on Payment Mode */}
          {paymentType === "FULL" && (
            <div className={styles.formGrid} style={{ margin: 0 }}>
              <div className={styles.inputGroup}>
                <label>Payment Method</label>
                <select 
                  name="paymentMethod" 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI PAYMENT">UPI PAYMENT (GPay, PhonePe, Paytm)</option>
                  <option value="BANK TRANSFER">BANK TRANSFER / NEFT / RTGS</option>
                  <option value="CASH">CASH</option>
                  <option value="NET BANKING">NET BANKING</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Payment Status</label>
                <select 
                  name="paymentStatus" 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending / Awaiting Payment</option>
                  <option value="Partially Paid">Partially Paid</option>
                </select>
              </div>
            </div>
          )}

          {paymentType === "SPLIT" && (
            <div style={{ background: "var(--surface-card)", padding: "14px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#3730A3" }}>
                  Enter split amount for each payment method:
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  Grand Total: ₹{grandTotal.toFixed(2)} | Split Sum: <strong style={{ color: splitSum === grandTotal ? "#10B981" : "#DC2626" }}>₹{splitSum.toFixed(2)}</strong>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                <div className={styles.inputGroup}>
                  <label style={{ fontSize: "12px" }}>UPI Payment (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={splitUpi || ""} 
                    placeholder="0.00"
                    onChange={(e) => setSplitUpi(Number(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label style={{ fontSize: "12px" }}>Cash (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={splitCash || ""} 
                    placeholder="0.00"
                    onChange={(e) => setSplitCash(Number(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label style={{ fontSize: "12px" }}>Bank / NEFT (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={splitBank || ""} 
                    placeholder="0.00"
                    onChange={(e) => setSplitBank(Number(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label style={{ fontSize: "12px" }}>Cheque / Card (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={splitCheque || ""} 
                    placeholder="0.00"
                    onChange={(e) => setSplitCheque(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
              <input 
                type="hidden" 
                name="splitBreakdownJson" 
                value={JSON.stringify({ cash: splitCash, upi: splitUpi, bank: splitBank, cheque: splitCheque })} 
              />
            </div>
          )}

          {paymentType === "CREDIT" && (
            <div style={{ background: "var(--surface-card)", padding: "14px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
              <div className={styles.formGrid} style={{ margin: 0 }}>
                <div className={styles.inputGroup}>
                  <label>Credit Terms / Period</label>
                  <select 
                    name="creditTerms" 
                    value={creditTerms}
                    onChange={(e) => setCreditTerms(e.target.value)}
                  >
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                    <option value="Pay on Delivery">Pay on Delivery / Handover</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Credit Due Date</label>
                  <input 
                    type="date" 
                    name="creditDueDate" 
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#B45309" }}>
                ⚠️ <strong>Credit Sale Notice:</strong> Amount of ₹{grandTotal.toFixed(2)} will be recorded as Outstanding Balance Due. Payment status will be tracked as Credit / Due.
              </div>
            </div>
          )}

          <div className={styles.inputGroup} style={{ marginTop: "14px" }}>
            <label htmlFor="bankDetails">Bank Details (Printed on Document)</label>
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

        {/* 4. Line Items Table with On-The-Fly Price Editing */}
        <div style={{ marginBottom: "24px", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-lg)", padding: "16px", background: "var(--surface-background)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <Package size={18} color="#4F46E5" /> Line Items &amp; Pricing (Unit Price Fully Editable)
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Add products or services from the catalog, or type custom items. Change any unit price directly on the fly.
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
                  <option value="">📦 Add from Catalog...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.isService ? "🛠️ " : "📦 "} {p.name} ({p.isService ? "Service" : `Stock: ${p.currentStock}`} • ₹{p.sellingPrice})
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

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--surface-card)", borderBottom: "1px solid var(--surface-border)", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", width: "40px" }}>#</th>
                  <th style={{ padding: "8px 10px" }}>Item Name &amp; Description</th>
                  <th style={{ padding: "8px 10px", width: "80px", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "8px 10px", width: "120px", textAlign: "right" }}>Unit Price (₹)</th>
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
                      {/* Fully editable unit price */}
                      <input 
                        type="number" 
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                        required
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4F46E5", textAlign: "right", fontWeight: 600, background: "#EEF2FF" }}
                        title="Click to edit unit price"
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

        {/* 5. Financial Summary Breakdown */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
          <div style={{ width: "340px", display: "flex", flexDirection: "column", gap: "8px", background: "var(--surface-background)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--surface-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "var(--text-muted)" }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
              <span style={{ color: "var(--text-muted)" }}>Additional Discount (₹):</span>
              <input 
                type="number" 
                step="0.01" 
                name="totalDiscount" 
                value={totalDiscount}
                onChange={(e) => setTotalDiscount(Number(e.target.value) || 0)}
                style={{ width: "110px", padding: "4px 8px", textAlign: "right", borderRadius: "4px", border: "1px solid var(--surface-border)" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, borderTop: "1px solid var(--surface-border)", paddingTop: "8px" }}>
              <span>Grand Total:</span>
              <span style={{ color: "#166534" }}>₹{grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
              <span>Effective Paid:</span>
              <span style={{ fontWeight: 600 }}>₹{effectivePaid.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
              <span>Balance Due / Credit:</span>
              <span style={{ fontWeight: 700, color: effectiveDue > 0 ? "#DC2626" : "inherit" }}>₹{effectiveDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 6. Scope of Work & Narrative */}
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
            <label htmlFor="paymentTermsNote">Payment Terms &amp; Scope Policy</label>
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
        <input type="hidden" name="paidAmount" value={effectivePaid.toFixed(2)} />
        <input type="hidden" name="amountDue" value={effectiveDue.toFixed(2)} />
        <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--surface-border)", paddingTop: "24px" }}>
          <Link href={isEdit ? `/billing/doc/${documentType.toLowerCase()}/${initialDocument.id}` : "/billing"} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Save size={16} /> {isEdit ? "Save Document Updates" : "Save & Generate Document"}
          </button>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            maxWidth: "540px",
            width: "100%",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={20} color="#4F46E5" /> Quick Add Customer While Billing
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddCustomerModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {custModalError && (
              <div style={{ padding: "8px 12px", background: "#FEE2E2", color: "#DC2626", borderRadius: "6px", fontSize: "13px", marginBottom: "14px" }}>
                {custModalError}
              </div>
            )}

            <form onSubmit={handleQuickCustomerSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Customer / Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe, Rajesh Kumar"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Company / Business Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    value={newCustCompany}
                    onChange={(e) => setNewCustCompany(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "14px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. client@example.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "14px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Address / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Kozhikode, Wayanad"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="32AAAAA0000A1Z5"
                      value={newCustGst}
                      onChange={(e) => setNewCustGst(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--surface-border)", fontSize: "14px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", borderTop: "1px solid var(--surface-border)", paddingTop: "14px" }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCustomerModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isCreatingCust}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {isCreatingCust ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Create &amp; Select Customer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
