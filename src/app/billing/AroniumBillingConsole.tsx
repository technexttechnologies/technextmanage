"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Receipt, 
  FileText, 
  ClipboardList, 
  CreditCard, 
  Search, 
  Printer, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  RefreshCcw,
  Edit3,
  Trash2,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Eye,
  FileDown,
  Moon,
  Sun,
  X,
  Download,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  Check
} from "lucide-react";
import styles from "./AroniumBillingConsole.module.css";
import { convertQuotationToInvoice, deleteBillingDocument } from "./actions";
import { deleteProduct } from "@/app/inventory/actions";

interface Props {
  invoices: any[];
  quotations: any[];
  products: any[];
  customers: any[];
  users: any[];
  projects: any[];
  metrics: {
    totalBilled: number;
    totalCollected: number;
    totalDue: number;
    activeQuotes: number;
  };
  initialTab?: "DOCUMENTS" | "REPORTING" | "DASHBOARD" | "PRODUCTS";
}

export default function AroniumBillingConsole({
  invoices = [],
  quotations = [],
  products = [],
  customers = [],
  users = [],
  projects = [],
  metrics,
  initialTab = "DOCUMENTS",
}: Props) {
  const router = useRouter();

  // Navigation View: DOCUMENTS, REPORTING, DASHBOARD, or PRODUCTS
  const [activeView, setActiveView] = useState<"DOCUMENTS" | "REPORTING" | "DASHBOARD" | "PRODUCTS">(initialTab);
  
  // Products Module State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductGroup, setSelectedProductGroup] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Theme State: DARK (authentic Aronium charcoal) or LIGHT
  const [theme, setTheme] = useState<"DARK" | "LIGHT">("DARK");

  useEffect(() => {
    const saved = localStorage.getItem("aronium_theme");
    if (saved === "LIGHT" || saved === "DARK") {
      setTheme(saved);
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toUpperCase();
      if (tabParam === "DOCUMENTS" || tabParam === "REPORTING" || tabParam === "DASHBOARD" || tabParam === "PRODUCTS") {
        setActiveView(tabParam as any);
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "DARK" ? "LIGHT" : "DARK";
    setTheme(next);
    localStorage.setItem("aronium_theme", next);
  };

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

  // Products Management Logic (Aronium Products Image 4)
  const productGroups = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category || "General"))).filter(Boolean).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedProductGroup && (p.category || "General") !== selectedProductGroup) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedProductGroup, productSearch]);

  const handleDeleteProduct = async () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    const confirmMsg = `Are you sure you want to delete product "${prod?.name || selectedProductId}"?`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingProduct(true);
    try {
      const res = await deleteProduct(selectedProductId);
      if (res.success) {
        setSelectedProductId(null);
        router.refresh();
      } else {
        alert(res.error || "Failed to delete product.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleExportProductsCSV = () => {
    const headers = ["Code/SKU", "Name", "Category", "Barcode", "Cost Price", "Tax %", "Sale Price", "Unit", "Is Service"];
    const rows = filteredProducts.map(p => [
      p.sku || p.aroniumId || p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
      `"${p.barcode || ''}"`,
      p.purchasePrice || 0,
      p.taxRate || 18,
      p.sellingPrice || 0,
      p.unit || (p.isService ? 'SERVICE' : 'PCS'),
      p.isService ? 'YES' : 'NO'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aronium_products_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Normalize All Documents into Unified Records
  const allDocuments = useMemo(() => {
    const invoiceRows = invoices.map((inv, idx) => {
      const sData = (inv.structuredData as any) || {};
      const type = sData.documentType || (inv.aroniumInvoiceNo?.includes("ORD") ? "ORDER_FORM" : inv.aroniumInvoiceNo?.includes("REC") ? "PAYMENT_RECEIPT" : "INVOICE");
      const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
      const totalAmount = Number(sData.totalAmount || inv.amountRequested || 0);
      const paidAmount = Number(sData.paidAmount || (isPaid ? totalAmount : 0));
      const amountDue = Math.max(0, totalAmount - paidAmount);

      // Line items
      const items = (sData.items && Array.isArray(sData.items) && sData.items.length > 0)
        ? sData.items
        : [
            {
              id: `item-${inv.id}`,
              name: inv.project ? inv.project.name : (inv.notes || "Professional Tech Services"),
              code: inv.aroniumInvoiceNo || `ITEM-${idx + 1}`,
              quantity: 1,
              unit: "Service",
              unitPrice: totalAmount,
              tax: "---",
              discount: "---",
              total: totalAmount
            }
          ];

      return {
        id: inv.id,
        rawId: inv.id,
        kind: type as "INVOICE" | "ORDER_FORM" | "PAYMENT_RECEIPT",
        docNumber: sData.documentNumber || inv.aroniumInvoiceNo || `26-200-${inv.id.slice(-6).toUpperCase()}`,
        externalRef: inv.project ? inv.project.name : (inv.aroniumInvoiceNo || "---"),
        customerName: inv.customer?.company || inv.customer?.name || "Client",
        customerId: inv.customer?.id || "",
        customerCode: inv.customer?.customerNumber ? `TN-${inv.customer.customerNumber}` : inv.customer?.aroniumCode ? `TN-${inv.customer.aroniumCode}` : `TN-${inv.customer?.id?.slice(-4) || '8779'}`,
        customerPhone: inv.customer?.phone || "",
        date: sData.date || inv.createdAt,
        dueDate: sData.dueDate || inv.createdAt,
        amount: totalAmount,
        paidAmount,
        amountDue,
        status: isPaid ? "Paid" : sData.paymentStatus || "Pending",
        paymentMethod: sData.paymentMethod || "UPI PAYMENT",
        userName: inv.assignedAdminId ? "Accounts Team" : "Admin",
        viewUrl: `/billing/doc/${type.toLowerCase()}/${inv.id}`,
        items: items.map((it: any, iIdx: number) => ({
          id: it.id || `doc-it-${iIdx + 1}`,
          code: it.code || it.sku || `SKU-${1000 + iIdx}`,
          name: it.name || "Product / Service Item",
          unit: it.unit || "Pcs",
          quantity: Number(it.quantity) || 1,
          priceBeforeTax: Number(it.unitPrice) || 0,
          tax: it.tax || "---",
          unitPrice: Number(it.unitPrice) || 0,
          totalBeforeDiscount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
          discount: it.discount || "---",
          total: Number(it.total) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)),
        }))
      };
    });

    const quoteRows = quotations.map((q, idx) => {
      const isApproved = q.status === "APPROVED" || q.status === "CONVERTED";
      const totalAmount = Number(q.totalAmount || 0);

      const items = (q.items && Array.isArray(q.items) && q.items.length > 0)
        ? q.items.map((it: any, iIdx: number) => ({
            id: it.id || `quote-it-${iIdx + 1}`,
            code: `Q-SKU-${100 + iIdx}`,
            name: it.name || "Proposal Item",
            unit: "Pcs",
            quantity: Number(it.quantity) || 1,
            priceBeforeTax: Number(it.price) || 0,
            tax: "---",
            unitPrice: Number(it.price) || 0,
            totalBeforeDiscount: (Number(it.quantity) || 1) * (Number(it.price) || 0),
            discount: "---",
            total: Number(it.total) || ((Number(it.quantity) || 1) * (Number(it.price) || 0)),
          }))
        : [
            {
              id: `qitem-${q.id}`,
              code: "Q-SRV",
              name: q.notes || "Digital Services Proposal",
              unit: "Project",
              quantity: 1,
              priceBeforeTax: totalAmount,
              tax: "---",
              unitPrice: totalAmount,
              totalBeforeDiscount: totalAmount,
              discount: "---",
              total: totalAmount
            }
          ];

      return {
        id: q.id,
        rawId: q.id,
        kind: "QUOTATION" as const,
        docNumber: q.quotationNumber,
        externalRef: "Quotation Estimate",
        customerName: q.companyName || q.customer?.name || "Client",
        customerId: q.customer?.id || "",
        customerCode: q.customer?.customerNumber ? `TN-${q.customer.customerNumber}` : q.customer?.aroniumCode ? `TN-${q.customer.aroniumCode}` : `TN-${q.customer?.id?.slice(-4) || '8779'}`,
        customerPhone: q.customer?.phone || "",
        date: q.date,
        dueDate: q.expiryDate || q.date,
        amount: totalAmount,
        paidAmount: isApproved ? totalAmount : 0,
        amountDue: isApproved ? 0 : totalAmount,
        status: isApproved ? "Approved" : q.status === "SENT" ? "Sent" : "Draft",
        paymentMethod: "ESTIMATE",
        userName: "Sales Staff",
        viewUrl: `/billing/doc/quotation/${q.id}`,
        items
      };
    });

    return [...invoiceRows, ...quoteRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, quotations]);

  // Selected Document in Master-Detail view
  const [selectedDocId, setSelectedDocId] = useState<string | null>(allDocuments[0]?.id || null);

  // Sync selectedDocId when document list changes
  useEffect(() => {
    if (!selectedDocId && allDocuments.length > 0) {
      setSelectedDocId(allDocuments[0].id);
    }
  }, [allDocuments, selectedDocId]);

  const selectedDoc = useMemo(() => {
    return allDocuments.find(d => d.id === selectedDocId) || allDocuments[0] || null;
  }, [allDocuments, selectedDocId]);

  // Filters State for Documents view
  const [filterProduct, setFilterProduct] = useState("ALL");
  const [filterUser, setFilterUser] = useState("ALL");
  const [filterCustomer, setFilterCustomer] = useState("ALL");
  const [filterDocType, setFilterDocType] = useState("ALL");
  const [filterPaidStatus, setFilterPaidStatus] = useState("ALL");
  const [filterDocNumber, setFilterDocNumber] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const handleClearFilters = () => {
    setFilterProduct("ALL");
    setFilterUser("ALL");
    setFilterCustomer("ALL");
    setFilterDocType("ALL");
    setFilterPaidStatus("ALL");
    setFilterDocNumber("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // Filtered documents for master table
  const filteredDocs = useMemo(() => {
    return allDocuments.filter(doc => {
      if (filterDocType !== "ALL" && doc.kind !== filterDocType) return false;
      if (filterCustomer !== "ALL" && doc.customerId !== filterCustomer) return false;
      if (filterPaidStatus !== "ALL") {
        if (filterPaidStatus === "Paid" && doc.status !== "Paid" && doc.status !== "Approved") return false;
        if (filterPaidStatus === "Pending" && doc.status !== "Pending" && doc.status !== "Sent") return false;
      }
      if (filterDocNumber) {
        const q = filterDocNumber.toLowerCase();
        const matches = 
          doc.docNumber.toLowerCase().includes(q) ||
          doc.customerName.toLowerCase().includes(q) ||
          doc.customerCode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterStartDate) {
        if (new Date(doc.date).getTime() < new Date(filterStartDate).getTime()) return false;
      }
      if (filterEndDate) {
        if (new Date(doc.date).getTime() > new Date(filterEndDate + "T23:59:59").getTime()) return false;
      }
      if (filterProduct !== "ALL") {
        const hasProd = doc.items.some((it: any) => it.name?.toLowerCase().includes(filterProduct.toLowerCase()) || it.code?.toLowerCase().includes(filterProduct.toLowerCase()));
        if (!hasProd) return false;
      }
      return true;
    });
  }, [allDocuments, filterDocType, filterCustomer, filterPaidStatus, filterDocNumber, filterStartDate, filterEndDate, filterProduct]);

  // -------------------------------------------------------------
  // Reporting Engine State & Calculations
  // -------------------------------------------------------------
  const [activeReportId, setActiveReportId] = useState<string>("PRODUCTS");
  const [repCustomer, setRepCustomer] = useState("ALL");
  const [repUser, setRepUser] = useState("ALL");
  const [repProduct, setRepProduct] = useState("ALL");
  const [repStartDate, setRepStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [repEndDate, setRepEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Compute Active Report Dataset
  const generatedReportData = useMemo(() => {
    // Filter base documents by date and customer
    const pool = allDocuments.filter(d => {
      if (repCustomer !== "ALL" && d.customerId !== repCustomer) return false;
      if (repStartDate && new Date(d.date).getTime() < new Date(repStartDate).getTime()) return false;
      if (repEndDate && new Date(d.date).getTime() > new Date(repEndDate + "T23:59:59").getTime()) return false;
      return true;
    });

    if (activeReportId === "PRODUCTS") {
      // Aggregate by product line item
      const map = new Map<string, { code: string; name: string; qty: number; revenue: number; ordersCount: number }>();
      pool.forEach(doc => {
        doc.items.forEach((it: any) => {
          const key = it.name.trim();
          const existing = map.get(key) || { code: it.code || "---", name: key, qty: 0, revenue: 0, ordersCount: 0 };
          existing.qty += (Number(it.quantity) || 1);
          existing.revenue += (Number(it.total) || 0);
          existing.ordersCount += 1;
          map.set(key, existing);
        });
      });

      const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
      return {
        title: "Sales by Products Report",
        headers: ["#", "Product Code", "Product / Service Name", "Quantity Sold", "Transactions", "Total Revenue (₹)"],
        rows: rows.map((r, i) => [
          i + 1,
          r.code,
          r.name,
          r.qty,
          r.ordersCount,
          `₹${formatCurrency(r.revenue)}`
        ]),
        totalSum: rows.reduce((s, r) => s + r.revenue, 0),
        totalQty: rows.reduce((s, r) => s + r.qty, 0),
      };
    } else if (activeReportId === "CUSTOMERS") {
      // Aggregate by customer
      const map = new Map<string, { name: string; code: string; phone: string; count: number; total: number; paid: number; due: number }>();
      pool.forEach(doc => {
        const key = doc.customerId || doc.customerName;
        const existing = map.get(key) || { name: doc.customerName, code: doc.customerCode, phone: doc.customerPhone, count: 0, total: 0, paid: 0, due: 0 };
        existing.count += 1;
        existing.total += doc.amount;
        existing.paid += doc.paidAmount;
        existing.due += doc.amountDue;
        map.set(key, existing);
      });

      const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
      return {
        title: "Sales by Customers Report",
        headers: ["#", "Customer Code", "Customer Name / Company", "Phone", "Invoices", "Billed Amount (₹)", "Paid (₹)", "Balance Due (₹)"],
        rows: rows.map((r, i) => [
          i + 1,
          r.code,
          r.name,
          r.phone || "---",
          r.count,
          `₹${formatCurrency(r.total)}`,
          `₹${formatCurrency(r.paid)}`,
          `₹${formatCurrency(r.due)}`
        ]),
        totalSum: rows.reduce((s, r) => s + r.total, 0),
        totalPaid: rows.reduce((s, r) => s + r.paid, 0),
        totalDue: rows.reduce((s, r) => s + r.due, 0),
      };
    } else if (activeReportId === "DAILY_SALES") {
      // Aggregate by day
      const map = new Map<string, { date: string; count: number; total: number; paid: number; due: number }>();
      pool.forEach(doc => {
        const dayStr = new Date(doc.date).toISOString().split("T")[0];
        const existing = map.get(dayStr) || { date: dayStr, count: 0, total: 0, paid: 0, due: 0 };
        existing.count += 1;
        existing.total += doc.amount;
        existing.paid += doc.paidAmount;
        existing.due += doc.amountDue;
        map.set(dayStr, existing);
      });

      const rows = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
      return {
        title: "Daily Sales Summary Report",
        headers: ["#", "Date", "Bills Generated", "Total Sales (₹)", "Total Collected (₹)", "Outstanding Due (₹)"],
        rows: rows.map((r, i) => [
          i + 1,
          formatDate(r.date),
          r.count,
          `₹${formatCurrency(r.total)}`,
          `₹${formatCurrency(r.paid)}`,
          `₹${formatCurrency(r.due)}`
        ]),
        totalSum: rows.reduce((s, r) => s + r.total, 0),
        totalPaid: rows.reduce((s, r) => s + r.paid, 0),
        totalDue: rows.reduce((s, r) => s + r.due, 0),
      };
    } else if (activeReportId === "PAYMENT_TYPES") {
      // Aggregate by payment method
      const map = new Map<string, { method: string; count: number; total: number }>();
      pool.forEach(doc => {
        const method = doc.paymentMethod || "UPI PAYMENT";
        const existing = map.get(method) || { method, count: 0, total: 0 };
        existing.count += 1;
        existing.total += doc.amount;
        map.set(method, existing);
      });

      const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
      return {
        title: "Payment Types Breakdown Report",
        headers: ["#", "Payment Tender Method", "Transactions", "Total Processed (₹)", "Share %"],
        rows: rows.map((r, i) => {
          const grand = pool.reduce((s, d) => s + d.amount, 0);
          const share = grand > 0 ? ((r.total / grand) * 100).toFixed(1) : "0.0";
          return [
            i + 1,
            r.method,
            r.count,
            `₹${formatCurrency(r.total)}`,
            `${share}%`
          ];
        }),
        totalSum: rows.reduce((s, r) => s + r.total, 0),
      };
    } else if (activeReportId === "UNPAID_SALES") {
      // Unpaid & balance due accounts
      const unpaidList = pool.filter(d => d.amountDue > 0);
      return {
        title: "Unpaid Sales & Accounts Receivable Report",
        headers: ["#", "Doc #", "Customer Name", "Phone", "Document Date", "Due Date", "Total (₹)", "Paid (₹)", "Outstanding Due (₹)"],
        rows: unpaidList.map((d, i) => [
          i + 1,
          d.docNumber,
          d.customerName,
          d.customerPhone || "---",
          formatDate(d.date),
          formatDate(d.dueDate),
          `₹${formatCurrency(d.amount)}`,
          `₹${formatCurrency(d.paidAmount)}`,
          `₹${formatCurrency(d.amountDue)}`
        ]),
        totalSum: unpaidList.reduce((s, d) => s + d.amount, 0),
        totalPaid: unpaidList.reduce((s, d) => s + d.paidAmount, 0),
        totalDue: unpaidList.reduce((s, d) => s + d.amountDue, 0),
      };
    } else {
      // INVOICES (Chronological Invoice List)
      return {
        title: "Chronological Invoice List Report",
        headers: ["#", "Doc #", "Type", "Customer / Company", "Date", "Payment Mode", "Status", "Amount (₹)"],
        rows: pool.map((d, i) => [
          i + 1,
          d.docNumber,
          d.kind.replace("_", " "),
          d.customerName,
          formatDate(d.date),
          d.paymentMethod,
          d.status,
          `₹${formatCurrency(d.amount)}`
        ]),
        totalSum: pool.reduce((s, d) => s + d.amount, 0),
        totalPaid: pool.reduce((s, d) => s + d.paidAmount, 0),
        totalDue: pool.reduce((s, d) => s + d.amountDue, 0),
      };
    }
  }, [allDocuments, activeReportId, repCustomer, repStartDate, repEndDate]);

  // CSV Exporter for Reporting
  const downloadReportCSV = () => {
    if (!generatedReportData) return;
    const { title, headers, rows } = generatedReportData;
    let csvContent = `data:text/csv;charset=utf-8,${title}\nGenerated on: ${new Date().toLocaleString()}\n\n`;
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach(r => {
      csvContent += r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `technext-${activeReportId.toLowerCase()}-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // Dashboard Calculations (Image 5)
  // -------------------------------------------------------------
  const monthlySales2026 = useMemo(() => {
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];
    const totals = Array(12).fill(0);

    allDocuments.forEach(doc => {
      const d = new Date(doc.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === 2026) {
        const m = d.getMonth();
        totals[m] += doc.amount;
      }
    });

    const maxVal = Math.max(...totals, 1000);
    const topIdx = totals.indexOf(Math.max(...totals));

    return {
      months,
      totals,
      maxVal,
      topMonthName: months[topIdx] || "SEPTEMBER",
      topMonthTotal: totals[topIdx] || 0,
      yearTotal: totals.reduce((a, b) => a + b, 0),
    };
  }, [allDocuments]);

  // Bar colors matching Aronium Dashboard screenshot (Image 5)
  const barColors = [
    "#64748B", "#64748B", "#64748B", "#64748B", 
    "#84cc16", "#e879f9", "#38bdf8", "#f43f5e", 
    "#f87171", "#60a5fa", "#64748B", "#64748B"
  ];

  return (
    <div className={`${styles.consoleContainer} ${theme === "DARK" ? styles.darkTheme : styles.lightTheme}`}>
      {/* 1. Aronium Top Management Header & View Switcher */}
      <header className={styles.topNav}>
        <div className={styles.breadcrumbGroup}>
          <span style={{ color: "#00a2ed", fontWeight: 700 }}>Management</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span className={styles.breadcrumbTitle}>
            {activeView === "DOCUMENTS" ? "Documents" : activeView === "REPORTING" ? "Reporting" : activeView === "PRODUCTS" ? "Products" : "Dashboard"}
          </span>
        </div>

        <div className={styles.tabPillGroup}>
          <button
            type="button"
            onClick={() => setActiveView("DASHBOARD")}
            className={`${styles.tabPill} ${activeView === "DASHBOARD" ? styles.tabPillActive : ""}`}
          >
            <TrendingUp size={14} /> Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveView("DOCUMENTS")}
            className={`${styles.tabPill} ${activeView === "DOCUMENTS" ? styles.tabPillActive : ""}`}
          >
            <Receipt size={14} /> Documents
          </button>
          <button
            type="button"
            onClick={() => setActiveView("PRODUCTS")}
            className={`${styles.tabPill} ${activeView === "PRODUCTS" ? styles.tabPillActive : ""}`}
          >
            <Package size={14} /> Products
          </button>
          <button
            type="button"
            onClick={() => setActiveView("REPORTING")}
            className={`${styles.tabPill} ${activeView === "REPORTING" ? styles.tabPillActive : ""}`}
          >
            <BarChart3 size={14} /> Reporting
          </button>
          <Link
            href="/customers"
            className={styles.tabPill}
            style={{ textDecoration: "none" }}
          >
            <Users size={14} /> Customers
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title="Toggle Aronium Dark / Light Console"
          >
            {theme === "DARK" ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} color="#6366F1" />}
            <span>{theme === "DARK" ? "Aronium Dark" : "Executive Light"}</span>
          </button>

          <Link
            href="/billing/new?type=invoice"
            className={styles.toolBtn}
            style={{ background: "#00a2ed", color: "#ffffff", fontWeight: 700 }}
          >
            <Plus size={14} /> New Bill
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* VIEW 1: MANAGEMENT • DOCUMENTS (Master-Detail Split Pane)   */}
      {/* ========================================================= */}
      {activeView === "DOCUMENTS" && (
        <>
          {/* Action Toolbar */}
          <div className={styles.actionToolbar}>
            <div style={{ background: "#00a2ed", color: "#ffffff", padding: "4px 10px", borderRadius: "3px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Receipt size={12} /> View documents
            </div>

            <div style={{ height: "18px", width: "1px", background: "rgba(148, 163, 184, 0.3)", margin: "0 4px" }} />

            <Link href="/billing/new?type=invoice" className={styles.toolBtn}>
              <Plus size={14} /> Add
            </Link>

            <button
              type="button"
              disabled={!selectedDoc}
              onClick={() => {
                if (selectedDoc) window.open(selectedDoc.viewUrl, "_blank");
              }}
              className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
            >
              <Printer size={14} /> Print
            </button>

            <button
              type="button"
              disabled={!selectedDoc}
              onClick={() => {
                if (selectedDoc) router.push(selectedDoc.viewUrl);
              }}
              className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
            >
              <Eye size={14} /> Print preview
            </button>

            <button
              type="button"
              disabled={!selectedDoc}
              onClick={() => {
                if (selectedDoc) window.open(selectedDoc.viewUrl, "_blank");
              }}
              className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
            >
              <FileDown size={14} /> Save as PDF
            </button>

            <button
              type="button"
              disabled={!selectedDoc}
              onClick={() => {
                if (selectedDoc) router.push(`/billing/doc/${selectedDoc.kind.toLowerCase()}/${selectedDoc.id}/edit`);
              }}
              className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
            >
              <Edit3 size={14} /> Edit
            </button>

            {selectedDoc && (
              <form 
                action={async (formData) => {
                  if (confirm(`Are you sure you want to delete ${selectedDoc.kind} #${selectedDoc.docNumber}?`)) {
                    await deleteBillingDocument(formData);
                    setSelectedDocId(null);
                  }
                }}
                style={{ display: "inline" }}
              >
                <input type="hidden" name="id" value={selectedDoc.id} />
                <input type="hidden" name="type" value={selectedDoc.kind.toLowerCase()} />
                <button
                  type="submit"
                  className={styles.toolBtn}
                  style={{ color: "#EF4444" }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </form>
            )}

            {selectedDoc?.customerPhone && (
              <a
                href={`https://wa.me/91${selectedDoc.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hello ${selectedDoc.customerName}, here is your ${selectedDoc.kind.replace('_', ' ')} #${selectedDoc.docNumber} from TechNext Technologies for ₹${formatCurrency(selectedDoc.amount)}. View document: https://technextmanage.vercel.app${selectedDoc.viewUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className={styles.toolBtn}
                style={{ color: "#22c55e" }}
              >
                <Share2 size={14} /> WhatsApp
              </a>
            )}
          </div>

          {/* Aronium Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Product</label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className={styles.selectField}
              >
                <option value="ALL">All products</option>
                {products.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Customer</label>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className={styles.selectField}
              >
                <option value="ALL">All customers</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Document Type</label>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                className={styles.selectField}
              >
                <option value="ALL">All document types</option>
                <option value="INVOICE">Invoices</option>
                <option value="QUOTATION">Quotations</option>
                <option value="ORDER_FORM">Order Forms</option>
                <option value="PAYMENT_RECEIPT">Payment Receipts</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Paid Status</label>
              <select
                value={filterPaidStatus}
                onChange={(e) => setFilterPaidStatus(e.target.value)}
                className={styles.selectField}
              >
                <option value="ALL">All transactions</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending / Unpaid</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Document Number</label>
              <input
                type="text"
                placeholder="Search number..."
                value={filterDocNumber}
                onChange={(e) => setFilterDocNumber(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Date From</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Date To</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <button type="button" onClick={handleClearFilters} className={styles.btnClear} title="Reset filters">
                <X size={14} /> Clear
              </button>
            </div>
          </div>

          {/* Master-Detail Split Pane */}
          <div className={styles.splitPaneContainer}>
            {/* Top Table: Master Documents (N) */}
            <div className={styles.panelCard} style={{ padding: "12px" }}>
              <div className={styles.paneHeader}>
                <span className={styles.paneTitle}>
                  Documents ({filteredDocs.length})
                </span>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Click any document row to view itemized lines below
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "24px" }}></th>
                      <th>Number</th>
                      <th>External Ref / Project</th>
                      <th>Document Type</th>
                      <th>Paid Status</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Payment Method</th>
                      <th style={{ textAlign: "right" }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", padding: "24px", opacity: 0.6 }}>
                          No documents found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc, idx) => {
                        const isSelected = selectedDoc?.id === doc.id;
                        return (
                          <tr
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            className={isSelected ? styles.selectedRow : ""}
                            style={{ cursor: "pointer" }}
                          >
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => setSelectedDocId(doc.id)}
                                style={{ accentColor: "#00a2ed" }}
                              />
                            </td>
                            <td style={{ fontWeight: 700, color: "#00a2ed" }}>
                              {doc.docNumber}
                            </td>
                            <td style={{ opacity: 0.85 }}>
                              {doc.externalRef}
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                                {doc.kind.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              <span className={doc.status === "Paid" || doc.status === "Approved" ? styles.badgePaid : styles.badgePending}>
                                {doc.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {doc.customerName}
                            </td>
                            <td>{formatDate(doc.date)}</td>
                            <td>{formatDate(doc.dueDate)}</td>
                            <td style={{ fontSize: "11px", opacity: 0.85 }}>{doc.paymentMethod}</td>
                            <td style={{ textAlign: "right", fontWeight: 800 }}>
                              ₹{formatCurrency(doc.amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Table: Document Items (N) for Selected Document */}
            <div className={styles.panelCard} style={{ padding: "12px" }}>
              <div className={styles.paneHeader}>
                <span className={styles.paneTitle} style={{ color: "#38bdf8" }}>
                  Document items ({selectedDoc ? selectedDoc.items.length : 0})
                  {selectedDoc && ` — #${selectedDoc.docNumber} (${selectedDoc.customerName})`}
                </span>
                {selectedDoc && (
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: 600 }}>
                    <span>Total Billed: <strong style={{ color: "#00a2ed" }}>₹{formatCurrency(selectedDoc.amount)}</strong></span>
                    <span>Paid: <strong style={{ color: "#22c55e" }}>₹{formatCurrency(selectedDoc.paidAmount)}</strong></span>
                    <span>Due: <strong style={{ color: selectedDoc.amountDue > 0 ? "#ef4444" : "inherit" }}>₹{formatCurrency(selectedDoc.amountDue)}</strong></span>
                  </div>
                )}
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "35px" }}>#</th>
                      <th>Code / SKU</th>
                      <th>Name / Description</th>
                      <th>Unit of Measure</th>
                      <th style={{ textAlign: "center" }}>Quantity</th>
                      <th style={{ textAlign: "right" }}>Unit Price</th>
                      <th style={{ textAlign: "center" }}>Tax</th>
                      <th style={{ textAlign: "right" }}>Discount</th>
                      <th style={{ textAlign: "right" }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedDoc || selectedDoc.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "20px", opacity: 0.6 }}>
                          Select a document above to inspect its itemized lines.
                        </td>
                      </tr>
                    ) : (
                      selectedDoc.items.map((item: any, iIdx: number) => (
                        <tr key={item.id || iIdx}>
                          <td style={{ opacity: 0.7 }}>{iIdx + 1}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "11px", opacity: 0.85 }}>{item.code}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.unit || "Pcs"}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                          <td style={{ textAlign: "right" }}>₹{formatCurrency(item.unitPrice)}</td>
                          <td style={{ textAlign: "center" }}>{item.tax || "---"}</td>
                          <td style={{ textAlign: "right" }}>{item.discount || "---"}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>₹{formatCurrency(item.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: MANAGEMENT • REPORTING (Image 2 Replica)           */}
      {/* ========================================================= */}
      {activeView === "REPORTING" && (
        <div className={styles.reportingLayout}>
          {/* Left Column: Reports Catalog */}
          <div className={`${styles.panelCard} ${styles.reportSideList}`}>
            <div style={{ background: "#00a2ed", color: "#ffffff", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, marginBottom: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <BarChart3 size={14} /> Select report
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7, display: "block", marginBottom: "6px" }}>
                Sales Reports
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {[
                  { id: "PRODUCTS", label: "Products" },
                  { id: "CUSTOMERS", label: "Customers" },
                  { id: "INVOICES", label: "Invoice list" },
                  { id: "DAILY_SALES", label: "Daily sales" },
                  { id: "PAYMENT_TYPES", label: "Payment types" },
                  { id: "UNPAID_SALES", label: "Unpaid sales" },
                ].map(rep => (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setActiveReportId(rep.id)}
                    className={`${styles.reportItemBtn} ${activeReportId === rep.id ? styles.reportItemBtnActive : ""}`}
                  >
                    <FileText size={13} /> {rep.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Filter & Output Panel */}
          <div className={`${styles.panelCard} ${styles.reportMainPanel}`}>
            {/* Filter Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div className={styles.filterItem}>
                <label className={styles.filterLabel}>Customers &amp; Suppliers</label>
                <select
                  value={repCustomer}
                  onChange={(e) => setRepCustomer(e.target.value)}
                  className={styles.selectField}
                >
                  <option value="ALL">All customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterItem}>
                <label className={styles.filterLabel}>Date From</label>
                <input
                  type="date"
                  value={repStartDate}
                  onChange={(e) => setRepStartDate(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.filterItem}>
                <label className={styles.filterLabel}>Date To</label>
                <input
                  type="date"
                  value={repEndDate}
                  onChange={(e) => setRepEndDate(e.target.value)}
                  className={styles.inputField}
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px solid rgba(148, 163, 184, 0.2)", paddingTop: "12px" }}>
              <button
                type="button"
                onClick={() => {}}
                className={styles.btnSearch}
                style={{ padding: "6px 14px" }}
              >
                <Search size={14} /> Show report
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className={styles.btnClear}
                style={{ padding: "6px 14px" }}
              >
                <Printer size={14} /> Print
              </button>

              <button
                type="button"
                onClick={downloadReportCSV}
                className={styles.btnClear}
                style={{ padding: "6px 14px", color: "#10b981", borderColor: "#10b981" }}
              >
                <Download size={14} /> Excel (CSV)
              </button>
            </div>

            {/* Generated Report Result View */}
            {generatedReportData && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#00a2ed" }}>
                    {generatedReportData.title}
                  </h3>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>
                    Total Volume: <span style={{ color: "#22c55e" }}>₹{formatCurrency(generatedReportData.totalSum || 0)}</span>
                  </div>
                </div>

                <div className={styles.tableWrapper} style={{ maxHeight: "480px" }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {generatedReportData.headers.map((h, hIdx) => (
                          <th key={hIdx}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generatedReportData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={generatedReportData.headers.length} style={{ textAlign: "center", padding: "24px", opacity: 0.6 }}>
                            No data available for the selected period and parameters.
                          </td>
                        </tr>
                      ) : (
                        generatedReportData.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell: any, cIdx: number) => (
                              <td key={cIdx} style={{ fontWeight: cIdx === 2 ? 600 : "normal" }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: MANAGEMENT • DASHBOARD (Image 5 Replica)           */}
      {/* ========================================================= */}
      {activeView === "DASHBOARD" && (
        <div className={styles.dashboardGrid}>
          {/* Top Card: Monthly Sales - 2026 Bar Chart */}
          <div className={`${styles.panelCard} ${styles.monthlyChartCard}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0" }}>
                  Monthly Sales - 2026
                </h2>
                <div style={{ fontSize: "13px", opacity: 0.75 }}>
                  Sales data grouped by month
                </div>
              </div>

              <div style={{ display: "flex", gap: "32px", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.75, textTransform: "uppercase" }}>Total Sales</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#00a2ed" }}>
                    ₹{formatCurrency(monthlySales2026.yearTotal)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", opacity: 0.75, textTransform: "uppercase" }}>Top Performing Month</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#22c55e" }}>
                    {monthlySales2026.topMonthName} — ₹{formatCurrency(monthlySales2026.topMonthTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "8px", alignItems: "flex-end", height: "160px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)", paddingBottom: "8px" }}>
              {monthlySales2026.months.map((m, idx) => {
                const val = monthlySales2026.totals[idx];
                const pct = monthlySales2026.maxVal > 0 ? Math.max(8, (val / monthlySales2026.maxVal) * 100) : 8;
                return (
                  <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    {val > 0 && (
                      <span style={{ fontSize: "10px", fontWeight: 700, marginBottom: "4px", opacity: 0.9 }}>
                        {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      </span>
                    )}
                    <div 
                      style={{ 
                        width: "100%", 
                        height: `${val > 0 ? pct : 4}%`, 
                        backgroundColor: barColors[idx] || "#00a2ed", 
                        borderRadius: "3px 3px 0 0",
                        transition: "height 0.3s ease"
                      }} 
                      title={`${m} 2026: ₹${formatCurrency(val)}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Month Labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "8px", marginTop: "6px", textAlign: "center", fontSize: "11px", opacity: 0.75, fontWeight: 600 }}>
              {monthlySales2026.months.map(m => (
                <div key={m}>{m}</div>
              ))}
            </div>
          </div>

          {/* Periodic Reports Grid */}
          <div className={styles.periodicGrid}>
            {/* Top Products */}
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0", color: "#00a2ed" }}>
                Top Products by Revenue
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {products.slice(0, 5).map((p, idx) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, opacity: 0.6, width: "16px" }}>{idx + 1}</span>
                      <span>{p.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#22c55e" }}>₹{formatCurrency(p.sellingPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0", color: "#00a2ed" }}>
                Top Customers (Lead Clients)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {customers.slice(0, 5).map((c, idx) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.company || c.name}</div>
                      <div style={{ fontSize: "11px", opacity: 0.65 }}>Code: TN-{c.customerNumber || c.aroniumCode || c.id.slice(-4)}</div>
                    </div>
                    <Link href={`/customers/${c.id}`} className={styles.toolBtn} style={{ padding: "2px 8px", fontSize: "11px" }}>
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Sales Financial Overview */}
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0", color: "#00a2ed" }}>
                Total Sales &amp; Collections
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>Total Invoiced Volume:</span>
                  <strong style={{ color: "#00a2ed" }}>₹{formatCurrency(metrics.totalBilled)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>Total Collected to Date:</span>
                  <strong style={{ color: "#22c55e" }}>₹{formatCurrency(metrics.totalCollected)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>Outstanding Receivables / Due:</span>
                  <strong style={{ color: metrics.totalDue > 0 ? "#ef4444" : "inherit" }}>₹{formatCurrency(metrics.totalDue)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderTop: "1px solid rgba(148, 163, 184, 0.15)", paddingTop: "8px" }}>
                  <span>Active Quotations:</span>
                  <strong>{metrics.activeQuotes}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: MANAGEMENT • PRODUCTS (Matching Aronium Image 4)   */}
      {/* ========================================================= */}
      {activeView === "PRODUCTS" && (
        <div className={styles.productsModuleLayout}>
          {/* Action Toolbar */}
          <div className={styles.actionToolbar}>
            <button
              type="button"
              onClick={() => router.refresh()}
              className={styles.toolBtn}
              title="Refresh Products"
            >
              <RefreshCcw size={14} /> Refresh
            </button>
            <Link
              href="/inventory/new"
              className={styles.toolBtn}
              style={{ background: "#00a2ed", color: "#ffffff", fontWeight: 700 }}
            >
              <Plus size={14} /> + New product
            </Link>
            <Link
              href={selectedProductId ? `/inventory/${selectedProductId}/edit` : "#"}
              className={`${styles.toolBtn} ${!selectedProductId ? styles.toolBtnDisabled : ""}`}
            >
              <Edit3 size={14} /> Edit product
            </Link>
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={!selectedProductId || isDeletingProduct}
              className={`${styles.toolBtn} ${!selectedProductId ? styles.toolBtnDisabled : ""}`}
              style={{ color: selectedProductId ? "#ef4444" : "inherit" }}
            >
              <Trash2 size={14} /> {isDeletingProduct ? "Deleting..." : "Delete product"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className={styles.toolBtn}
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              onClick={handleExportProductsCSV}
              className={styles.toolBtn}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Group Tree & Products Split */}
          <div className={styles.productsSplit}>
            {/* Left Group Tree Panel */}
            <div className={`${styles.panelCard} ${styles.groupTreePanel}`}>
              <div className={styles.groupTreeHeader}>
                <Layers size={13} color="#00a2ed" />
                <span style={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>Categories</span>
              </div>
              <div className={styles.groupTreeList}>
                <button
                  type="button"
                  onClick={() => setSelectedProductGroup(null)}
                  className={`${styles.groupTreeItem} ${selectedProductGroup === null ? styles.groupTreeItemActive : ""}`}
                >
                  📁 All Products ({products.length})
                </button>
                {productGroups.map(grp => {
                  const count = products.filter(p => (p.category || "General") === grp).length;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedProductGroup(grp)}
                      className={`${styles.groupTreeItem} ${selectedProductGroup === grp ? styles.groupTreeItemActive : ""}`}
                    >
                      📂 {grp} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Products Table Area */}
            <div className={styles.productsTableArea}>
              <div className={styles.productsSubBar}>
                <div className={styles.productSearchWrapper}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search product name, barcode, SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className={styles.inputField}
                    style={{ paddingLeft: "30px" }}
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      style={{ position: "absolute", right: "8px", top: "7px", background: "none", border: "none", color: "inherit", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#00a2ed" }}>
                  Products count: {filteredProducts.length}
                </div>
              </div>

              {/* Products Table */}
              <div className={styles.tableWrapper} style={{ maxHeight: "calc(100vh - 250px)" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Code</th>
                      <th>Name</th>
                      <th>Group</th>
                      <th>Barcode</th>
                      <th style={{ textAlign: "right" }}>Cost</th>
                      <th style={{ textAlign: "right" }}>Sale price (excl.)</th>
                      <th style={{ textAlign: "center" }}>Taxes</th>
                      <th style={{ textAlign: "right" }}>Sale price</th>
                      <th style={{ textAlign: "center" }}>Active</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>
                          No products found in this category.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p, idx) => {
                        const isSelected = selectedProductId === p.id;
                        const taxPct = Number(p.taxRate || 18);
                        const exclPrice = Number(p.sellingPrice || 0) / (1 + taxPct / 100);
                        const code = p.sku || p.aroniumId || `PROD-${idx + 1}`;

                        return (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedProductId(p.id)}
                            onDoubleClick={() => router.push(`/inventory/${p.id}/edit`)}
                            className={isSelected ? styles.selectedRow : ""}
                            style={{ cursor: "pointer" }}
                          >
                            <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{code}</td>
                            <td style={{ fontWeight: 600 }}>
                              {p.name}
                              {p.isService && (
                                <span style={{ marginLeft: "6px", fontSize: "10px", padding: "1px 5px", borderRadius: "3px", background: "#3b82f6", color: "#fff", fontWeight: 700 }}>
                                  SERVICE
                                </span>
                              )}
                            </td>
                            <td>{p.category || "General"}</td>
                            <td style={{ fontFamily: "monospace", opacity: 0.8 }}>{p.barcode || "---"}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{formatCurrency(p.purchasePrice)}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{formatCurrency(exclPrice)}</td>
                            <td style={{ textAlign: "center" }}>{taxPct}%</td>
                            <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "#00a2ed" }}>₹{formatCurrency(p.sellingPrice)}</td>
                            <td style={{ textAlign: "center", color: "#10b981", fontWeight: 700 }}>✓</td>
                            <td style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 600 }}>
                              {p.unit || (p.isService ? "SERVICE" : "PCS")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
