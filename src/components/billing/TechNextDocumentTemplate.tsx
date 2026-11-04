"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Printer, 
  Share2, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Receipt, 
  ClipboardList, 
  CreditCard,
  Edit3,
  Trash2,
  PlusCircle,
  X,
  Calendar,
  Layers,
  Download,
  RotateCcw,
  Bell
} from "lucide-react";
import styles from "./TechNextDocumentTemplate.module.css";
import { deleteBillingDocument, recordDocumentPayment } from "@/app/billing/actions";
import { generateDocumentVectorPdf } from "@/lib/vectorPdfGenerator";
import { cleanPhoneNumber, buildPaymentReminderMessage, getAppUrl } from "@/lib/whatsapp";
import { RazorpayPaymentButton } from "./RazorpayPaymentButton";

export type BillingDocType = "INVOICE" | "QUOTATION" | "ORDER_FORM" | "PAYMENT_RECEIPT" | "REFUND";

export interface PaymentInstallment {
  id?: string;
  date: string | Date;
  amount: number;
  method: string;
  reference?: string;
  status: "PAID" | "PENDING" | string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface BillingItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  tax?: string;
  discount?: string | number;
  total: number;
}

export interface BillingDocumentData {
  id?: string;
  documentType: BillingDocType;
  documentNumber: string;
  date: string | Date;
  dueDate?: string | Date | null;
  paymentStatus?: "Paid" | "Pending" | "Partially Paid" | "Cancelled" | string;
  paymentMethod?: string;
  paymentType?: "FULL" | "SPLIT" | "CREDIT" | "MULTI_DATE";
  paymentSchedule?: PaymentInstallment[];
  splitBreakdown?: {
    cash?: number;
    upi?: number;
    bank?: number;
    cheque?: number;
  };
  creditDueDate?: string | Date | null;
  creditTerms?: string | null;
  bankDetails?: string;

  customer: {
    id?: string;
    name: string;
    company?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    customerNumber?: number | string | null;
    aroniumCode?: string | null;
    gstNumber?: string | null;
    portalToken?: string | null;
  };

  items: BillingItem[];

  subtotal?: number;
  totalDiscount?: number;
  totalAmount: number;
  paidAmount?: number;
  amountDue?: number;

  scopeOfWork?: string;
  paymentTermsNote?: string;
  terms?: string[];
  supportTerms?: string[];
  authorizedBy?: string;
  paymentReference?: string;
}

interface Props {
  data: BillingDocumentData;
  backUrl?: string;
  showTypeSwitcher?: boolean;
  showActionButtons?: boolean;
}

export default function TechNextDocumentTemplate({
  data,
  backUrl = "/billing",
  showTypeSwitcher = true,
  showActionButtons = true,
}: Props) {
  const [docType, setDocType] = useState<BillingDocType>(data.documentType || "INVOICE");
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("UPI PAYMENT");
  const [payRef, setPayRef] = useState("");
  const [payStatus, setPayStatus] = useState("PAID");
  const [isRecording, setIsRecording] = useState(false);

  // Auto-trigger direct vector PDF download or browser print when passed via URL query
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("download") === "pdf") {
        setTimeout(() => {
          generateDocumentVectorPdf({ ...data, documentType: docType });
        }, 400);
      } else if (params.get("print") === "true") {
        setTimeout(() => {
          window.print();
        }, 400);
      }
    }
  }, [data, docType]);

  // Helper date formatter: dd-MMM-yyyy (e.g. 07-Oct-2026)
  const formatDate = (val?: string | Date | null) => {
    if (!val) return "---";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return "0.00";
    return Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Titles & Labels mapping per type
  const titles: Record<BillingDocType, string> = {
    INVOICE: "INVOICE",
    QUOTATION: "QUOTATION",
    ORDER_FORM: "ORDER FORM",
    PAYMENT_RECEIPT: "PAYMENT RECEIPT",
    REFUND: "CREDIT NOTE / REFUND"
  };

  const numberLabels: Record<BillingDocType, string> = {
    INVOICE: "Invoice No.:",
    QUOTATION: "Quotation No.:",
    ORDER_FORM: "Order No.:",
    PAYMENT_RECEIPT: "Receipt No.:",
    REFUND: "Credit Note No.:"
  };

  const dateLabels: Record<BillingDocType, string> = {
    INVOICE: "Date:",
    QUOTATION: "Date:",
    ORDER_FORM: "Order Date:",
    PAYMENT_RECEIPT: "Payment Date:",
    REFUND: "Refund Date:"
  };

  const dueLabels: Record<BillingDocType, string> = {
    INVOICE: "Due date:",
    QUOTATION: "Valid until:",
    ORDER_FORM: "Delivery due:",
    PAYMENT_RECEIPT: "Ref Invoice:",
    REFUND: "Ref Document:"
  };

  const subtotal = data.subtotal !== undefined 
    ? data.subtotal 
    : data.items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const totalAmount = data.totalAmount || subtotal;
  const totalDiscount = data.totalDiscount || 0;
  const paidAmount = data.paidAmount !== undefined 
    ? data.paidAmount 
    : (data.paymentStatus === "Paid" ? totalAmount : 0);
  const amountDue = data.amountDue !== undefined 
    ? data.amountDue 
    : Math.max(0, totalAmount - paidAmount);

  const customerCode = data.customer.customerNumber 
    ? `TN-${data.customer.customerNumber}` 
    : data.customer.aroniumCode 
    ? `TN-${data.customer.aroniumCode}` 
    : "TN-8779";

  const bankText = data.bankDetails || "SOUTH INDIAN BANK\nPULPALLY";

  // Scope of Work / Deliverables lines (Matching Uploaded Generation on the left of summary)
  const scopeLines = React.useMemo(() => {
    let lines: string[] = [];
    if (data.scopeOfWork) {
      lines = data.scopeOfWork.split(/\n|;/).map(s => s.trim()).filter(Boolean);
    }
    if (lines.length === 0) {
      lines = (data.items || []).filter(it => it.description && it.description !== it.name).map(it => it.description!);
    }
    return lines;
  }, [data.scopeOfWork, data.items]);

  // WhatsApp Share URL (Fixed +91 bug using cleanPhoneNumber & verified customer portal URL)
  const prepareWhatsAppUrl = () => {
    const phone = cleanPhoneNumber(data.customer.phone);
    const docName = titles[docType];
    const portalUrl = data.customer?.portalToken
      ? `${getAppUrl()}/portal/${data.customer.portalToken}/${docType === "QUOTATION" ? "quotations" : "invoices"}/${data.id}`
      : (docType === "QUOTATION" ? `${getAppUrl()}/quotation/${data.id}` : `${getAppUrl()}/request/invoice/${data.id}`);

    const text = encodeURIComponent(
      `Hello ${data.customer.name},\n\nPlease find your official ${docName} (#${data.documentNumber}) from TechNext Technologies for ₹${formatCurrency(totalAmount)}.\n\nStatus: ${data.paymentStatus || 'Pending'}\n\n🔗 View & Pay Online: ${portalUrl}\n\nThank you for choosing TechNext Technologies!`
    );
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  // Dedicated Payment Reminder URL (Sends customer portal link with invoice breakdown & online payment)
  const preparePaymentReminderUrl = () => {
    const phone = cleanPhoneNumber(data.customer.phone);
    const dueAmt = Math.max(0, totalAmount - (paidAmount || (data.paymentStatus === "Paid" ? totalAmount : 0)));
    const portalUrl = data.customer?.portalToken
      ? `${getAppUrl()}/portal/${data.customer.portalToken}/invoices/${data.id}`
      : `${getAppUrl()}/request/invoice/${data.id}`;

    const text = encodeURIComponent(
      buildPaymentReminderMessage({
        customerName: data.customer.name,
        invoiceNumber: data.documentNumber,
        totalAmount: totalAmount,
        pendingAmount: dueAmt,
        dueDate: data.dueDate ? String(data.dueDate) : undefined,
        viewUrl: portalUrl
      })
    );
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <div className={styles.pageWrapper}>
      {/* On-screen controls */}
      {showActionButtons && (
        <div className={styles.actionBar}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href={backUrl} className={styles.btnBack}>
              <ArrowLeft size={16} /> Back
            </Link>

            {showTypeSwitcher && (
              <div className={styles.typeSwitcher}>
                {docType === "REFUND" ? (
                  <div className={`${styles.typeBtn} ${styles.typeBtnActive}`} style={{ color: "#ef4444", fontWeight: 700 }}>
                    <RotateCcw size={14} /> Credit Note / Refund
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setDocType("INVOICE")}
                      className={`${styles.typeBtn} ${docType === "INVOICE" ? styles.typeBtnActive : ""}`}
                    >
                      <Receipt size={14} /> Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType("QUOTATION")}
                      className={`${styles.typeBtn} ${docType === "QUOTATION" ? styles.typeBtnActive : ""}`}
                    >
                      <FileText size={14} /> Quotation
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType("ORDER_FORM")}
                      className={`${styles.typeBtn} ${docType === "ORDER_FORM" ? styles.typeBtnActive : ""}`}
                    >
                      <ClipboardList size={14} /> Order Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType("PAYMENT_RECEIPT")}
                      className={`${styles.typeBtn} ${docType === "PAYMENT_RECEIPT" ? styles.typeBtnActive : ""}`}
                    >
                      <CreditCard size={14} /> Payment Receipt
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            {data.id && amountDue > 0 && docType !== "QUOTATION" && (
              <RazorpayPaymentButton
                invoiceId={data.id}
                amountDue={amountDue}
                totalAmount={totalAmount}
                invoiceNumber={data.documentNumber}
                customerName={data.customer.name}
                customerPhone={data.customer.phone || undefined}
                customerEmail={data.customer.email || undefined}
                token={data.customer.portalToken || undefined}
                isPaid={data.paymentStatus === "Paid" || amountDue <= 0}
                variant="compact"
              />
            )}

            {data.id && amountDue > 0 && docType !== "QUOTATION" && (
              <button
                type="button"
                onClick={() => {
                  setPayAmount(amountDue);
                  setShowRecordPaymentModal(true);
                }}
                className={styles.btnBack}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#166534", borderColor: "#86EFAC", background: "#F0FDF4", cursor: "pointer", fontWeight: 600 }}
              >
                <PlusCircle size={15} /> Record Payment
              </button>
            )}

            {data.id && (
              <Link
                href={`/billing/doc/${docType.toLowerCase()}/${data.id}/edit`}
                className={styles.btnBack}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#4F46E5", borderColor: "#C7D2FE", background: "#EEF2FF" }}
              >
                <Edit3 size={15} /> Edit
              </Link>
            )}

            {data.id && (
              <form action={async (formData) => {
                if (confirm("Are you sure you want to delete this billing document? This action cannot be undone.")) {
                  await deleteBillingDocument(formData);
                }
              }}>
                <input type="hidden" name="id" value={data.id} />
                <input type="hidden" name="type" value={docType.toLowerCase()} />
                <button
                  type="submit"
                  className={styles.btnBack}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", cursor: "pointer" }}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </form>
            )}

            {data.customer.phone && docType !== "QUOTATION" && docType !== "REFUND" && data.paymentStatus !== "Paid" && (
              <a
                href={preparePaymentReminderUrl()}
                target="_blank"
                rel="noreferrer"
                className={styles.btnSecondary}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#B45309", borderColor: "#FDE68A", background: "#FEF3C7", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                title="Send WhatsApp Payment Reminder"
              >
                <Bell size={15} /> Payment Reminder
              </a>
            )}

            <a
              href={prepareWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className={styles.btnWhatsApp}
            >
              <Share2 size={15} /> WhatsApp
            </a>
            <button
              type="button"
              onClick={() => generateDocumentVectorPdf({ ...data, documentType: docType })}
              className={styles.btnPrint}
              style={{ background: "#0284c7" }}
              title="Download 100% Vector PDF (Crisp typography, genuine downloadable PDF document)"
            >
              <Download size={15} /> Save as PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className={styles.btnPrint}
              title="Print via browser dialog"
            >
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
      )}

      {/* Official Document Sheet */}
      <div className={styles.documentSheet}>
        {/* Header Section */}
        <div className={styles.docHeader}>
          <div className={styles.titleCompanyBlock}>
            <h1 className={styles.docTitle}>{titles[docType]}</h1>
            <div className={styles.companyName}>TECHNEXT TECHNOLOGIES</div>
            <div className={styles.companyLine}>PULPALLY</div>
            <div className={styles.companyLine}>WAYANAD,673579</div>
            <div className={styles.companyEmailRow}>
              <span className={styles.companyEmailLabel}>Email:</span>
              <span>info.technexttech@gmail.com</span>
            </div>
          </div>

          <div className={styles.logoBlock}>
            {/* TechNext official logo */}
            <img
              src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png"
              alt="TECHNEXT TECHNOLOGIES"
              className={styles.logoImg}
              crossOrigin="anonymous"
            />
          </div>
        </div>

        <hr className={styles.headerDivider} />

        {/* Bill to & Metadata Info Grid */}
        <div className={styles.infoGrid}>
          {/* Bill To */}
          <div className={styles.billToCol}>
            <div className={styles.billToTitle}>
              {docType === "QUOTATION" ? "Quotation For" : docType === "ORDER_FORM" ? "Ordered By" : docType === "PAYMENT_RECEIPT" ? "Received From" : "Bill to"}
            </div>
            <div className={styles.clientName}>
              {data.customer.company || data.customer.name}
            </div>
            {data.customer.address && (
              <div className={styles.clientAddress} style={{ whiteSpace: "pre-line" }}>
                {data.customer.address}
              </div>
            )}
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Phone:</span>
              <span>{data.customer.phone || "---"}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Email:</span>
              <span>{data.customer.email || "---"}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Code:</span>
              <span>{customerCode}</span>
            </div>
            {data.customer.gstNumber && (
              <div className={styles.clientRow}>
                <span className={styles.clientLabel}>GSTIN:</span>
                <span>{data.customer.gstNumber}</span>
              </div>
            )}
          </div>

          {/* Document Metadata */}
          <div className={styles.metaCol}>
            <table className={styles.metaTable}>
              <tbody>
                <tr>
                  <td className={styles.metaLabelCol}>{numberLabels[docType]}</td>
                  <td className={styles.metaValCol}>{data.documentNumber}</td>
                </tr>
                <tr>
                  <td className={styles.metaLabelCol}>{dateLabels[docType]}</td>
                  <td className={styles.metaValCol}>{formatDate(data.date)}</td>
                </tr>
                <tr>
                  <td className={styles.metaLabelCol}>{dueLabels[docType]}</td>
                  <td className={styles.metaValCol}>
                    {docType === "PAYMENT_RECEIPT" 
                      ? (data.paymentReference || data.documentNumber.replace("REC", "INV")) 
                      : formatDate(data.dueDate || data.date)}
                  </td>
                </tr>
                {docType !== "QUOTATION" && (
                  <tr>
                    <td className={styles.metaLabelCol}>Payment status:</td>
                    <td className={`${styles.metaValCol} ${styles.metaStatusPaid}`}>
                      {data.paymentStatus || "Paid"}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className={styles.metaLabelCol}>Bank details:</td>
                  <td className={styles.metaValCol} style={{ whiteSpace: "pre-line" }}>
                    {bankText}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Table */}
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th className={styles.colIdx}>#</th>
              <th className={styles.colItem}>Item</th>
              <th className={styles.colQty}>Quantity</th>
              <th className={styles.colPrice}>Unit price</th>
              <th className={styles.colDiscount}>Discount</th>
              <th className={styles.colTotal}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "16px", color: "#6b7280" }}>
                  No items listed.
                </td>
              </tr>
            ) : (
              data.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className={styles.colIdx}>{idx + 1}</td>
                  <td className={styles.colItem}>
                    <p className={styles.itemName}>{item.name}</p>
                    {item.description && (
                      <p className={styles.itemDesc}>{item.description}</p>
                    )}
                  </td>
                  <td className={styles.colQty}>{item.quantity}</td>
                  <td className={styles.colPrice}>{formatCurrency(item.unitPrice)}</td>
                  <td className={styles.colDiscount}>
                    {item.discount !== undefined && item.discount !== null
                      ? String(item.discount).includes("%") || String(item.discount).startsWith("-")
                        ? item.discount
                        : `-${formatCurrency(Number(item.discount))}`
                      : "---"}
                  </td>
                  <td className={styles.colTotal}>{formatCurrency(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Post-Table 2-Column Split Layout: Scope Deliverables on Left, Totals on Right (Matching Uploaded Generation) */}
        <div className={styles.postTableSplit}>
          {/* Left Column: Scope / Deliverables List */}
          <div className={styles.postTableLeftCol}>
            {scopeLines.length > 0 ? (
              scopeLines.map((line, idx) => (
                <div key={idx} className={styles.scopeItemLine}>
                  {line.toUpperCase()}
                </div>
              ))
            ) : (
              <div style={{ color: "#4b5563", fontStyle: "italic", fontSize: "11px" }}>
                Official digital solutions &amp; technology services.
              </div>
            )}

            {data.paymentTermsNote && !scopeLines.includes(data.paymentTermsNote) && (
              <div style={{ marginTop: "12px", fontSize: "11px", color: "#4b5563", lineHeight: 1.45 }}>
                {data.paymentTermsNote}
              </div>
            )}
          </div>

          {/* Right Column: Total Box & Tender Payment Details */}
          <div className={styles.postTableRightCol}>
            {totalDiscount > 0 && (
              <div className={styles.summaryRow}>
                <span>Discount</span>
                <span className={styles.discountVal}>-₹{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            <div className={styles.totalBox}>
              <span>{docType === "QUOTATION" ? "Total Estimate" : docType === "ORDER_FORM" ? "Total Order Value" : "Total"}</span>
              <span>₹{formatCurrency(totalAmount)}</span>
            </div>

            {docType !== "QUOTATION" && (
              <div className={styles.paymentDetailsBlock}>
                <div className={styles.payRowBold}>
                  <span>Payment method:</span>
                </div>

                {data.splitBreakdown && (Number(data.splitBreakdown.upi) > 0 || Number(data.splitBreakdown.cash) > 0) ? (
                  <>
                    {Number(data.splitBreakdown.upi) > 0 && (
                      <div className={styles.payRow}>
                        <span>UPI PAYMENT:</span>
                        <span>₹{formatCurrency(data.splitBreakdown.upi)}</span>
                      </div>
                    )}
                    {Number(data.splitBreakdown.cash) > 0 && (
                      <div className={styles.payRow}>
                        <span>CASH PAYMENT:</span>
                        <span>₹{formatCurrency(data.splitBreakdown.cash)}</span>
                      </div>
                    )}
                    {Number(data.splitBreakdown.bank) > 0 && (
                      <div className={styles.payRow}>
                        <span>BANK / NEFT:</span>
                        <span>₹{formatCurrency(data.splitBreakdown.bank)}</span>
                      </div>
                    )}
                    {Number(data.splitBreakdown.cheque) > 0 && (
                      <div className={styles.payRow}>
                        <span>CHEQUE / CARD:</span>
                        <span>₹{formatCurrency(data.splitBreakdown.cheque)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.payRow}>
                    <span>{(data.paymentMethod || "UPI PAYMENT").toUpperCase().includes("UPI") ? "UPI PAYMENT:" : `${(data.paymentMethod || "CASH").toUpperCase()}:`}</span>
                    <span>₹{formatCurrency(paidAmount > 0 ? paidAmount : 0)}</span>
                  </div>
                )}

                {data.creditTerms && (
                  <div style={{ margin: "4px 0", padding: "4px 6px", background: "#FEF3C7", borderRadius: "3px", border: "1px solid #FDE68A", fontSize: "11px", color: "#92400E" }}>
                    <div>Credit Terms: <strong>{data.creditTerms}</strong></div>
                    {data.creditDueDate && <div>Due Date: <strong>{formatDate(data.creditDueDate)}</strong></div>}
                  </div>
                )}

                <div className={styles.payRow}>
                  <span>Paid amount:</span>
                  <span style={{ color: paidAmount > 0 ? "#166534" : "inherit", fontWeight: paidAmount > 0 ? 600 : "normal" }}>
                    ₹{formatCurrency(paidAmount)}
                  </span>
                </div>

                <div className={styles.payRowBold}>
                  <span>Amount due:</span>
                  <span style={{ color: amountDue > 0 ? "#DC2626" : "#166534" }}>₹{formatCurrency(amountDue)}</span>
                </div>

                {paidAmount > 0 && amountDue > 0 && (
                  <div className={styles.payRow} style={{ marginTop: "4px", padding: "3px 6px", background: "#EFF6FF", borderRadius: "4px", border: "1px solid #BFDBFE" }}>
                    <span style={{ color: "#1D4ED8", fontWeight: 600, fontSize: "11px" }}>Status:</span>
                    <span style={{ color: "#1D4ED8", fontWeight: 700, fontSize: "11px" }}>Partially Paid (₹{formatCurrency(paidAmount)} received)</span>
                  </div>
                )}

                {data.id && amountDue > 0 && docType !== "QUOTATION" && (
                  <div style={{ marginTop: "12px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
                    <RazorpayPaymentButton
                      invoiceId={data.id}
                      amountDue={amountDue}
                      totalAmount={totalAmount}
                      invoiceNumber={data.documentNumber}
                      customerName={data.customer.name}
                      customerPhone={data.customer.phone || undefined}
                      customerEmail={data.customer.email || undefined}
                      token={data.customer.portalToken || undefined}
                      isPaid={data.paymentStatus === "Paid" || amountDue <= 0}
                      variant="compact"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Multi-Date Payment Schedule & Installment Ledger Table (Invoices / Orders Only) */}
        {docType !== "QUOTATION" && data.paymentSchedule && data.paymentSchedule.length > 0 && (
          <div className={styles.installmentSection}>
            <div className={styles.installmentTitle}>
              Payment Schedule &amp; Installment Ledger
            </div>
            <table className={styles.installmentTable}>
              <thead>
                <tr>
                  <th style={{ width: "35px", textAlign: "center" }}>#</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Reference / Milestone Note</th>
                  <th style={{ textAlign: "center", width: "100px" }}>Status</th>
                  <th style={{ textAlign: "right", width: "130px" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentSchedule.map((inst, idx) => (
                  <tr key={inst.id || idx}>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{formatDate(inst.date)}</td>
                    <td>{inst.method}</td>
                    <td style={{ color: "#64748b" }}>{inst.reference || "---"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={inst.status === "PAID" ? styles.badgePaid : styles.badgePending}>
                        {inst.status === "PAID" ? "Paid" : "Scheduled"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹{formatCurrency(inst.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures for Order Forms / Payment Receipt */}
        {(docType === "ORDER_FORM" || docType === "PAYMENT_RECEIPT" || docType === "QUOTATION") && (
          <div className={styles.signatureSection}>
            <div className={styles.signatureBox}>
              <div className={styles.signatureLine} />
              <div className={styles.signatureTitle}>
                {docType === "PAYMENT_RECEIPT" ? "Verified Accounts Officer" : "Authorized By (TechNext)"}
              </div>
              <div className={styles.signatureSub}>
                {data.authorizedBy || "TechNext Technologies"}
              </div>
            </div>

            <div className={styles.signatureBox}>
              <div className={styles.signatureLine} />
              <div className={styles.signatureTitle}>
                {docType === "PAYMENT_RECEIPT" ? "Received with Thanks" : "Client Acceptance Signature"}
              </div>
              <div className={styles.signatureSub}>
                {data.customer.company || data.customer.name}
              </div>
            </div>
          </div>
        )}

        {/* Footer & Policies Section */}
        <div className={styles.docFooter}>
          <div className={styles.footerThanks}>Thank You for Choosing</div>
          <div className={styles.footerCompany}>TECHNEXT TECHNOLOGIES</div>
          <div className={styles.footerTagline}>
            Delivering Innovative Digital Solutions with Quality, Creativity &amp; Trust.
          </div>
          <div className={styles.footerBar}>
            ━━━━━━━━━━━━━━━━━━━━━━
          </div>

          <div className={styles.policyGrid}>
            <div>
              <div className={styles.policyTitle}>Payment Terms</div>
              <ul className={styles.policyList}>
                <li>Kindly make the payment within the due date mentioned on the performa</li>
                <li>50% advance payment is applicable for customized projects/services</li>
                <li>Late payments may attract additional service charges</li>
                <li>Payments once processed are non-refundable after project initiation</li>
              </ul>
            </div>
            <div>
              <div className={styles.policyTitle}>Support &amp; Service</div>
              <ul className={styles.policyList}>
                <li>Technical support will be provided as per the selected service package</li>
                <li>Any additional revisions or services beyond the agreed scope may be chargeable</li>
                <li>Warranty/service coverage applies only to specified products &amp; durations</li>
              </ul>
            </div>
          </div>

          <div className={styles.pageNumberFooter}>
            <span>TechNext Technologies • www.technexttechnologies.in</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Record Payment Installment
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                  Document #{data.documentNumber} • Outstanding Due: <strong style={{ color: "#DC2626" }}>₹{formatCurrency(amountDue)}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowRecordPaymentModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form action={async (formData) => {
              setIsRecording(true);
              try {
                await recordDocumentPayment(formData);
                setShowRecordPaymentModal(false);
              } catch (err: any) {
                alert(err.message || "Failed to record payment");
              } finally {
                setIsRecording(false);
              }
            }}>
              <input type="hidden" name="documentId" value={data.id} />

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Payment Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Amount Received / Scheduled (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    max={amountDue}
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Payment Mode</label>
                    <select
                      name="method"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    >
                      <option value="UPI PAYMENT">UPI PAYMENT</option>
                      <option value="BANK TRANSFER">BANK TRANSFER / NEFT</option>
                      <option value="CASH">CASH</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="NET BANKING">NET BANKING</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Status</label>
                    <select
                      name="status"
                      value={payStatus}
                      onChange={(e) => setPayStatus(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    >
                      <option value="PAID">Paid / Received</option>
                      <option value="PENDING">Scheduled / Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Milestone / Note / UTR Reference</label>
                  <input
                    type="text"
                    name="reference"
                    placeholder="e.g. Advance payment / Milestone 2 / UTR 402910482"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowRecordPaymentModal(false)}
                    className={styles.btnBack}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRecording || payAmount <= 0}
                    className={styles.btnPrint}
                    style={{ background: "#166534" }}
                  >
                    {isRecording ? "Recording..." : "Save Payment"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
