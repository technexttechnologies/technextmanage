"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  FileText, 
  ClipboardList, 
  CreditCard, 
  Search, 
  Printer, 
  Share2, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  RefreshCcw,
  Edit3,
  Trash2,
  Bell
} from "lucide-react";
import styles from "./page.module.css";
import { convertQuotationToInvoice, deleteBillingDocument } from "./actions";
import { 
  getWhatsAppLink, 
  buildPaymentReminderMessage,
  buildInvoiceNotificationMessage,
  buildQuotationNotificationMessage,
  getAppUrl 
} from "@/lib/whatsapp";

interface Props {
  invoices: any[];
  quotations: any[];
  metrics: {
    totalBilled: number;
    totalCollected: number;
    totalDue: number;
    activeQuotes: number;
  };
}

export default function BillingDashboardClient({
  invoices,
  quotations,
  metrics,
}: Props) {
  const [activeTab, setActiveTab] = useState<"ALL" | "INVOICES" | "QUOTATIONS" | "ORDERS" | "RECEIPTS">("ALL");
  const [search, setSearch] = useState("");

  const formatCurrency = (amt: number) => {
    return Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (d: any) => {
    if (!d) return "---";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Normalize all items into a single list
  const invoiceRows = invoices.map(inv => {
    const sData = (inv.structuredData as any) || {};
    const type = sData.documentType || (inv.aroniumInvoiceNo?.includes("ORD") ? "ORDER_FORM" : inv.aroniumInvoiceNo?.includes("REC") ? "PAYMENT_RECEIPT" : "INVOICE");
    const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
    
    return {
      id: inv.id,
      kind: type as "INVOICE" | "ORDER_FORM" | "PAYMENT_RECEIPT",
      docNumber: sData.documentNumber || inv.aroniumInvoiceNo || `26-200-${inv.id.slice(-6).toUpperCase()}`,
      customerName: inv.customer?.name || "Client",
      customerCompany: inv.customer?.company || "",
      customerCode: inv.customer?.customerNumber ? `TN-${inv.customer.customerNumber}` : inv.customer?.aroniumCode ? `TN-${inv.customer.aroniumCode}` : `TN-${inv.customer?.id?.slice(-4) || '8779'}`,
      customerPhone: inv.customer?.phone || "",
      customerPortalToken: inv.customer?.portalToken,
      date: sData.date || inv.createdAt,
      dueDate: sData.dueDate || inv.createdAt,
      amount: sData.totalAmount || inv.amountRequested,
      status: isPaid ? "Paid" : "Pending",
      rawStatus: inv.status,
      viewUrl: `/billing/doc/${type.toLowerCase()}/${inv.id}`,
    };
  });

  const quoteRows = quotations.map(q => {
    const isApproved = q.status === "APPROVED" || q.status === "CONVERTED";
    return {
      id: q.id,
      kind: "QUOTATION" as const,
      docNumber: q.quotationNumber,
      customerName: q.customer?.name || "Client",
      customerCompany: q.companyName || q.customer?.company || "",
      customerCode: q.customer?.customerNumber ? `TN-${q.customer.customerNumber}` : q.customer?.aroniumCode ? `TN-${q.customer.aroniumCode}` : `TN-${q.customer?.id?.slice(-4) || '8779'}`,
      customerPhone: q.customer?.phone || "",
      customerPortalToken: q.customer?.portalToken,
      date: q.date,
      dueDate: q.expiryDate || q.date,
      amount: q.totalAmount,
      status: isApproved ? "Approved" : q.status === "SENT" ? "Sent" : "Draft",
      rawStatus: q.status,
      viewUrl: `/billing/doc/quotation/${q.id}`,
    };
  });

  const allDocuments = [...invoiceRows, ...quoteRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filtered = allDocuments.filter(doc => {
    if (activeTab === "INVOICES" && doc.kind !== "INVOICE") return false;
    if (activeTab === "QUOTATIONS" && doc.kind !== "QUOTATION") return false;
    if (activeTab === "ORDERS" && doc.kind !== "ORDER_FORM") return false;
    if (activeTab === "RECEIPTS" && doc.kind !== "PAYMENT_RECEIPT") return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.docNumber.toLowerCase().includes(q) ||
      doc.customerName.toLowerCase().includes(q) ||
      doc.customerCompany.toLowerCase().includes(q) ||
      doc.customerCode.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* 1. Header Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            <Receipt size={24} />
          </div>
          <div>
            <div className={styles.metricValue}>₹{formatCurrency(metrics.totalBilled)}</div>
            <div className={styles.metricLabel}>Total Invoiced</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: "#DCFCE7", color: "#166534" }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.metricValue} style={{ color: "#166534" }}>₹{formatCurrency(metrics.totalCollected)}</div>
            <div className={styles.metricLabel}>Total Collected</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: "#FEE2E2", color: "#991B1B" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className={styles.metricValue} style={{ color: metrics.totalDue > 0 ? "#DC2626" : "inherit" }}>
              ₹{formatCurrency(metrics.totalDue)}
            </div>
            <div className={styles.metricLabel}>Outstanding Balance Due</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: "#FEF3C7", color: "#B45309" }}>
            <FileText size={24} />
          </div>
          <div>
            <div className={styles.metricValue}>{metrics.activeQuotes}</div>
            <div className={styles.metricLabel}>Active Quotations</div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar & Quick Document Creator Buttons */}
      <div className={styles.filterBar}>
        <div className={styles.tabGroup}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Documents ({allDocuments.length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'INVOICES' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('INVOICES')}
          >
            <Receipt size={14} /> Invoices ({invoiceRows.filter(i => i.kind === 'INVOICE').length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'QUOTATIONS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('QUOTATIONS')}
          >
            <FileText size={14} /> Quotations ({quoteRows.length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'ORDERS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('ORDERS')}
          >
            <ClipboardList size={14} /> Order Forms ({invoiceRows.filter(i => i.kind === 'ORDER_FORM').length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'RECEIPTS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('RECEIPTS')}
          >
            <CreditCard size={14} /> Payment Receipts ({invoiceRows.filter(i => i.kind === 'PAYMENT_RECEIPT').length})
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div className={styles.searchBox}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by client, doc #, code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Link href="/billing/new?type=invoice" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> New Bill
          </Link>
          <Link href="/billing/new?type=quotation" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FileText size={16} /> New Quote
          </Link>
        </div>
      </div>

      {/* 3. Document Table */}
      <div className={styles.card}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Receipt size={40} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
            <p>No billing documents found for the selected filter.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Doc #</th>
                <th>Client / Company</th>
                <th>Date</th>
                <th>Due / Expiry</th>
                <th style={{ textAlign: "right" }}>Amount (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => (
                <tr key={`${doc.kind}-${doc.id}-${idx}`}>
                  <td>
                    <span 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "4px", 
                        fontSize: "12px", 
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: doc.kind === "INVOICE" ? "#EEF2FF" : doc.kind === "QUOTATION" ? "#FEF3C7" : doc.kind === "ORDER_FORM" ? "#E0E7FF" : "#DCFCE7",
                        color: doc.kind === "INVOICE" ? "#4F46E5" : doc.kind === "QUOTATION" ? "#B45309" : doc.kind === "ORDER_FORM" ? "#3730A3" : "#166534"
                      }}
                    >
                      {doc.kind === "INVOICE" && <Receipt size={12} />}
                      {doc.kind === "QUOTATION" && <FileText size={12} />}
                      {doc.kind === "ORDER_FORM" && <ClipboardList size={12} />}
                      {doc.kind === "PAYMENT_RECEIPT" && <CreditCard size={12} />}
                      {doc.kind.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={doc.viewUrl} style={{ color: "var(--brand-primary)", textDecoration: "none" }}>
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{doc.customerCompany || doc.customerName}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {doc.customerCode} {doc.customerPhone ? `• ${doc.customerPhone}` : ""}
                    </div>
                  </td>
                  <td>{formatDate(doc.date)}</td>
                  <td>{formatDate(doc.dueDate)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    ₹{formatCurrency(doc.amount)}
                  </td>
                  <td>
                    <span 
                      className={`${styles.badge} ${
                        doc.status === 'Paid' || doc.status === 'Approved' ? styles.badgePaid :
                        doc.status === 'Pending' || doc.status === 'Sent' ? styles.badgePending :
                        styles.badgePartial
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className={styles.actionBtnGroup} style={{ justifyContent: "flex-end" }}>
                      <Link 
                        href={doc.viewUrl} 
                        className={styles.iconBtn} 
                        title="View Official Document"
                      >
                        <Printer size={13} /> View
                      </Link>

                      <Link 
                        href={`/billing/doc/${doc.kind.toLowerCase()}/${doc.id}/edit`} 
                        className={styles.iconBtn} 
                        style={{ color: "#4F46E5" }}
                        title="Edit Document"
                      >
                        <Edit3 size={13} /> Edit
                      </Link>

                      {doc.customerPhone && (
                        <a 
                          href={getWhatsAppLink(
                            doc.customerPhone,
                            `Hello ${doc.customerName}, here is your ${doc.kind.replace('_', ' ')} #${doc.docNumber} for ₹${formatCurrency(doc.amount)}. View document: ${doc.customerPortalToken ? (doc.kind === 'QUOTATION' ? `https://technextmanage.vercel.app/portal/${doc.customerPortalToken}/quotations/${doc.id}` : `https://technextmanage.vercel.app/portal/${doc.customerPortalToken}/invoices/${doc.id}`) : (doc.kind === 'QUOTATION' ? `https://technextmanage.vercel.app/quotation/${doc.id}` : `https://technextmanage.vercel.app/request/invoice/${doc.id}`)}`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.iconBtn}
                          style={{ color: "#16a34a" }}
                          title="Share on WhatsApp"
                        >
                          <Share2 size={13} /> WhatsApp
                        </a>
                      )}

                      {doc.customerPhone && doc.kind === "INVOICE" && doc.status !== "Paid" && (
                        <a 
                          href={getWhatsAppLink(
                            doc.customerPhone,
                            buildPaymentReminderMessage({
                              customerName: doc.customerName,
                              invoiceNumber: doc.docNumber,
                              totalAmount: doc.amount,
                              pendingAmount: doc.amount,
                              dueDate: doc.date,
                              viewUrl: doc.customerPortalToken ? `https://technextmanage.vercel.app/portal/${doc.customerPortalToken}/invoices/${doc.id}` : `https://technextmanage.vercel.app/request/invoice/${doc.id}`
                            })
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.iconBtn}
                          style={{ color: "#ca8a04", borderColor: "#fef08a", background: "#fefce8" }}
                          title="Send Payment Reminder on WhatsApp"
                        >
                          <Bell size={13} /> Reminder
                        </a>
                      )}

                      {doc.kind === "QUOTATION" && doc.rawStatus !== "CONVERTED" && (
                        <form action={async () => {
                          await convertQuotationToInvoice(doc.id);
                        }}>
                          <button 
                            type="submit" 
                            className={styles.iconBtn}
                            style={{ color: "#4F46E5" }}
                            title="Convert into Official Invoice Bill"
                          >
                            <RefreshCcw size={13} /> Convert to Bill
                          </button>
                        </form>
                      )}

                      <form action={async (formData) => {
                        if (confirm(`Are you sure you want to delete ${doc.kind.replace('_', ' ')} #${doc.docNumber}?`)) {
                          await deleteBillingDocument(formData);
                        }
                      }}>
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="type" value={doc.kind.toLowerCase()} />
                        <button 
                          type="submit" 
                          className={styles.iconBtn}
                          style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                          title="Delete Document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
