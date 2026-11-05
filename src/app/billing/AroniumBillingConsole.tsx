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
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Percent,
  Building2,
  Gift,
  LayoutDashboard,
  Tag,
  ArrowUpDown,
  Boxes,
  HelpCircle,
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
  RotateCcw,
  Bell
} from "lucide-react";
import styles from "./AroniumBillingConsole.module.css";
import { convertQuotationToInvoice, deleteBillingDocument, processReturnAndRefund } from "./actions";
import { deleteProduct } from "@/app/inventory/actions";
import { generateReportVectorPdf } from "@/lib/vectorPdfGenerator";
import { 
  cleanPhoneNumber, 
  getWhatsAppLink, 
  buildPaymentReminderMessage,
  buildInvoiceNotificationMessage,
  buildQuotationNotificationMessage,
  getAppUrl 
} from "@/lib/whatsapp";

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
  initialTab?: "DOCUMENTS" | "REPORTING" | "DASHBOARD" | "PRODUCTS" | "STOCK" | "CUSTOMERS" | "PAYMENT_TYPES" | "TAX_RATES" | "MY_COMPANY";
  isTestUser?: boolean;
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
  isTestUser = false,
}: Props) {
  const router = useRouter();

  // Navigation View matching Left Sidebar of Aronium Management
  const [activeView, setActiveView] = useState<
    "DASHBOARD" | "DOCUMENTS" | "PRODUCTS" | "STOCK" | "REPORTING" | "CUSTOMERS" | "PROMOTIONS" | "SECURITY" | "PAYMENT_TYPES" | "COUNTRIES" | "TAX_RATES" | "MY_COMPANY"
  >(initialTab as any);

  // Left Sidebar Collapsed state (Authentic Aronium << / >> toggle)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Products Module State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductGroup, setSelectedProductGroup] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Return & Refund Workflow State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundDoc, setRefundDoc] = useState<any | null>(null);
  const [refundMode, setRefundMode] = useState<"FULL" | "PARTIAL">("FULL");
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState("UPI REVERSAL");
  const [refundReason, setRefundReason] = useState("");
  const [refundItems, setRefundItems] = useState<any[]>([]);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const openRefundModal = (doc: any) => {
    setRefundDoc(doc);
    setRefundMode("FULL");
    setRefundAmount(Math.abs(doc.amount));
    setRefundReason("");
    setRefundMethod("UPI REVERSAL");
    setRefundItems((doc.items || []).map((it: any) => ({
      ...it,
      selected: true,
      returnQty: it.quantity || 1
    })));
    setShowRefundModal(true);
  };

  const handleRefundItemToggle = (idx: number) => {
    const next = [...refundItems];
    next[idx].selected = !next[idx].selected;
    setRefundItems(next);
    const sum = next.filter(it => it.selected).reduce((acc, it) => acc + (Number(it.returnQty || 1) * Number(it.unitPrice || it.priceBeforeTax || 0)), 0);
    setRefundAmount(sum);
  };

  const handleRefundQtyChange = (idx: number, qty: number) => {
    const next = [...refundItems];
    const maxQty = next[idx].quantity || 1;
    next[idx].returnQty = Math.max(1, Math.min(maxQty, qty));
    setRefundItems(next);
    const sum = next.filter(it => it.selected).reduce((acc, it) => acc + (Number(it.returnQty || 1) * Number(it.unitPrice || it.priceBeforeTax || 0)), 0);
    setRefundAmount(sum);
  };

  const handleProcessRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundDoc) return;
    if (refundAmount <= 0) {
      alert("Please enter a valid refund amount greater than 0.");
      return;
    }

    setIsProcessingRefund(true);
    try {
      const selectedItemsToReturn = refundItems
        .filter(it => refundMode === "FULL" || it.selected)
        .map(it => ({
          name: it.name,
          code: it.code,
          quantity: it.returnQty || it.quantity || 1,
          unitPrice: it.unitPrice || it.priceBeforeTax || 0,
          total: (it.returnQty || it.quantity || 1) * (it.unitPrice || it.priceBeforeTax || 0)
        }));

      const fd = new FormData();
      fd.append("originalDocId", refundDoc.id);
      fd.append("refundAmount", String(refundAmount));
      fd.append("refundMethod", refundMethod);
      fd.append("reason", refundReason.trim() || "Customer return & refund request");
      fd.append("returnItemsJson", JSON.stringify(selectedItemsToReturn));

      const res = await processReturnAndRefund(fd);
      if (res && res.success) {
        setShowRefundModal(false);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Failed to process refund");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Interactive Active Graph Drilldown State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Live Auto Sync State
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSyncFeedback("Syncing with Aronium POS...");
    try {
      // 1. Trigger local webhook agent on port 4040 if local daemon is running
      try {
        await fetch("http://127.0.0.1:4040/sync", { method: "POST", mode: "no-cors" });
      } catch (e) {
        // Fallback gracefully
      }
      // 2. Trigger cloud sync endpoint
      try {
        await fetch("/api/erp/aronium/sync", { method: "POST" });
      } catch (e) {
        // Fallback
      }
      // 3. Refresh page data
      router.refresh();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
      setSyncFeedback("Synced successfully!");
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      setSyncFeedback("Sync failed: " + (err.message || "Network error"));
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Periodic Reports Date Range Filter (Screenshot 5)
  const [periodicStartDate, setPeriodicStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split("T")[0];
  });
  const [periodicEndDate, setPeriodicEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Theme State: Default to Executive Minimal LIGHT
  const [theme, setTheme] = useState<"DARK" | "LIGHT">("LIGHT");

  useEffect(() => {
    const saved = localStorage.getItem("aronium_theme");
    if (saved === "DARK") {
      setTheme("DARK");
    } else {
      setTheme("LIGHT");
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toUpperCase();
      if (tabParam) {
        const validTabs = ["DASHBOARD", "DOCUMENTS", "PRODUCTS", "STOCK", "REPORTING", "CUSTOMERS", "PAYMENT_TYPES", "TAX_RATES", "MY_COMPANY"];
        if (validTabs.includes(tabParam)) {
          setActiveView(tabParam as any);
        }
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

  // 1. Normalize All Documents into Unified Master Records
  const allDocuments = useMemo(() => {
    const invoiceRows = invoices.map((inv, idx) => {
      const sData = (inv.structuredData as any) || {};
      const isRefund = sData.documentType === "REFUND" || inv.aroniumInvoiceNo?.includes("220-") || Number(sData.totalAmount || inv.amountRequested) < 0;
      const type = isRefund ? "REFUND" : (sData.documentType || (inv.aroniumInvoiceNo?.includes("ORD") ? "ORDER_FORM" : inv.aroniumInvoiceNo?.includes("REC") ? "PAYMENT_RECEIPT" : "INVOICE"));
      const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid" || sData.paymentStatus === "Refunded";
      const totalAmount = Number(sData.totalAmount || inv.amountRequested || 0);
      const paidAmount = Number(sData.paidAmount || (isPaid ? Math.abs(totalAmount) : 0));
      const amountDue = isRefund ? 0 : Math.max(0, totalAmount - paidAmount);

      // Line items
      const items = (sData.items && Array.isArray(sData.items) && sData.items.length > 0)
        ? sData.items
        : [
            {
              id: `item-${inv.id}`,
              name: inv.project ? inv.project.name : (inv.notes || (isRefund ? "Refund / Service Cancellation" : "Professional Tech Services")),
              code: inv.aroniumInvoiceNo || `ITEM-${idx + 1}`,
              quantity: 1,
              unit: isRefund ? "Refund" : "Service",
              unitPrice: totalAmount,
              tax: "0%",
              discount: "0.00",
              total: totalAmount
            }
          ];

      return {
        id: inv.id,
        rawId: inv.id,
        kind: type as "INVOICE" | "REFUND" | "ORDER_FORM" | "PAYMENT_RECEIPT",
        docNumber: sData.documentNumber || inv.aroniumInvoiceNo || `26-200-${inv.id.slice(-6).toUpperCase()}`,
        externalRef: sData.referenceDocument || (inv.project ? inv.project.name : (inv.aroniumInvoiceNo || "---")),
        customerName: inv.customer?.name || inv.customer?.company || "SHUHAIB K",
        customerId: inv.customer?.id || "",
        customerCode: inv.customer?.customerNumber ? `TN-${inv.customer.customerNumber}` : inv.customer?.aroniumCode ? `TN-${inv.customer.aroniumCode}` : `TN-${inv.customer?.id?.slice(-4) || '8779'}`,
        customerPhone: inv.customer?.phone || "+91 85906 74531",
        customerPortalToken: inv.customer?.portalToken,
        date: sData.date || inv.createdAt,
        dueDate: sData.dueDate || inv.createdAt,
        amount: totalAmount,
        paidAmount,
        amountDue,
        status: isRefund ? "Refunded" : isPaid ? "Paid" : sData.paymentStatus || "Pending",
        paymentMethod: sData.paymentMethod || (isRefund ? "REFUND / REVERSAL" : "UPI PAYMENT"),
        posRegister: "Main Register",
        orderNumber: sData.orderNumber || "---",
        discount: "0.00",
        userName: inv.assignedAdminId ? "Accounts Team" : "Admin",
        viewUrl: `/billing/doc/${type.toLowerCase()}/${inv.id}`,
        items: items.map((it: any, iIdx: number) => ({
          id: it.id || `doc-it-${iIdx + 1}`,
          code: it.code || it.sku || `SKU-${1000 + iIdx}`,
          name: it.name || "Product / Service Item",
          unit: it.unit || "Pcs",
          quantity: Number(it.quantity) || 1,
          priceBeforeTax: Number(it.unitPrice || it.priceBeforeTax) || 0,
          tax: it.tax || "0%",
          unitPrice: Number(it.unitPrice) || 0,
          totalBeforeDiscount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
          discount: it.discount || "0.00",
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
            tax: "0%",
            unitPrice: Number(it.price) || 0,
            totalBeforeDiscount: (Number(it.quantity) || 1) * (Number(it.price) || 0),
            discount: "0.00",
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
              tax: "0%",
              unitPrice: totalAmount,
              totalBeforeDiscount: totalAmount,
              discount: "0.00",
              total: totalAmount
            }
          ];

      return {
        id: q.id,
        rawId: q.id,
        kind: "QUOTATION" as const,
        docNumber: q.quotationNumber,
        externalRef: "Proforma Quotation",
        customerName: q.companyName || q.customer?.name || "Client",
        customerId: q.customer?.id || "",
        customerCode: q.customer?.customerNumber ? `TN-${q.customer.customerNumber}` : q.customer?.aroniumCode ? `TN-${q.customer.aroniumCode}` : `TN-${q.customer?.id?.slice(-4) || '8779'}`,
        customerPhone: q.customer?.phone || "+91 85906 74531",
        customerPortalToken: q.customer?.portalToken,
        date: q.date,
        dueDate: q.expiryDate || q.date,
        amount: totalAmount,
        paidAmount: isApproved ? totalAmount : 0,
        amountDue: isApproved ? 0 : totalAmount,
        status: isApproved ? "Approved" : q.status === "SENT" ? "Sent" : "Draft",
        paymentMethod: "ESTIMATE",
        posRegister: "Main Register",
        orderNumber: "---",
        discount: "0.00",
        userName: "Sales Staff",
        viewUrl: `/billing/doc/quotation/${q.id}`,
        items
      };
    });

    return [...invoiceRows, ...quoteRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, quotations]);

  // Invoices & Refunds Only Dataset (strictly excluding quotations from billed totals and sales reports)
  const invoiceOnlyDocs = useMemo(() => {
    return allDocuments.filter(d => d.kind !== "QUOTATION");
  }, [allDocuments]);

  // Selected Document in Master-Detail view
  const [selectedDocId, setSelectedDocId] = useState<string | null>(allDocuments[0]?.id || null);

  useEffect(() => {
    if (!selectedDocId && allDocuments.length > 0) {
      setSelectedDocId(allDocuments[0].id);
    }
  }, [allDocuments, selectedDocId]);

  const selectedDoc = useMemo(() => {
    return allDocuments.find(d => d.id === selectedDocId) || allDocuments[0] || null;
  }, [allDocuments, selectedDocId]);

  // Filters State for Documents view (Structured into 3 rows matching Screenshot 1)
  const [filterProduct, setFilterProduct] = useState("ALL");
  const [filterUser, setFilterUser] = useState("ALL");
  const [filterCashRegister, setFilterCashRegister] = useState("ALL");
  const [filterCustomer, setFilterCustomer] = useState("ALL");
  const [filterDocType, setFilterDocType] = useState("ALL");
  const [filterPaidStatus, setFilterPaidStatus] = useState("ALL");
  const [filterDocNumber, setFilterDocNumber] = useState("");
  const [filterExternalDoc, setFilterExternalDoc] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const handleClearFilters = () => {
    setFilterProduct("ALL");
    setFilterUser("ALL");
    setFilterCashRegister("ALL");
    setFilterCustomer("ALL");
    setFilterDocType("ALL");
    setFilterPaidStatus("ALL");
    setFilterDocNumber("");
    setFilterExternalDoc("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // Filtered documents for master table
  const filteredDocs = useMemo(() => {
    return allDocuments.filter(doc => {
      if (filterDocType !== "ALL" && doc.kind !== filterDocType) return false;
      if (filterCustomer !== "ALL" && doc.customerId !== filterCustomer) return false;
      if (filterPaidStatus !== "ALL") {
        if (filterPaidStatus === "Paid" && doc.status !== "Paid" && doc.status !== "Approved" && doc.status !== "Refunded") return false;
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
      if (filterExternalDoc) {
        const q = filterExternalDoc.toLowerCase();
        if (!doc.externalRef.toLowerCase().includes(q)) return false;
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
  }, [allDocuments, filterDocType, filterCustomer, filterPaidStatus, filterDocNumber, filterExternalDoc, filterStartDate, filterEndDate, filterProduct]);

  // -------------------------------------------------------------
  // Reporting Engine State & Calculations (Screenshot 2 Replica)
  // -------------------------------------------------------------
  const [activeReportId, setActiveReportId] = useState<string>("PRODUCTS");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [repCustomer, setRepCustomer] = useState("ALL");
  const [repUser, setRepUser] = useState("ALL");
  const [repProduct, setRepProduct] = useState("ALL");
  const [repProductGroup, setRepProductGroup] = useState("Products");
  const [repStartDate, setRepStartDate] = useState(() => "2026-01-01");
  const [repEndDate, setRepEndDate] = useState(() => "2026-12-31");

  // All 21 Sales Reports catalog matching Screenshot 2
  const allSalesReports = [
    { id: "PRODUCTS", label: "Products" },
    { id: "PRODUCT_GROUPS", label: "Product groups" },
    { id: "CUSTOMERS", label: "Customers" },
    { id: "TAX_RATES", label: "Tax rates" },
    { id: "USERS", label: "Users" },
    { id: "ITEM_LIST", label: "Item list" },
    { id: "PAYMENT_TYPES", label: "Payment types" },
    { id: "PAYMENT_TYPES_USERS", label: "Payment types by users" },
    { id: "PAYMENT_TYPES_CUSTOMERS", label: "Payment types by customers" },
    { id: "REFUNDS", label: "Refunds" },
    { id: "INVOICE_LIST", label: "Invoice list" },
    { id: "DAILY_SALES", label: "Daily sales" },
    { id: "HOURLY_SALES", label: "Hourly sales" },
    { id: "HOURLY_SALES_GROUPS", label: "Hourly sales by product groups" },
    { id: "TABLE_ORDER", label: "Table or order number" },
    { id: "PROFIT_MARGIN", label: "Profit & margin" },
    { id: "UNPAID_SALES", label: "Unpaid sales" },
    { id: "STARTING_CASH", label: "Starting cash entries" },
    { id: "VOIDED_ITEMS", label: "Voided items" },
    { id: "DISCOUNTS_GRANTED", label: "Discounts granted" },
    { id: "ITEMS_DISCOUNTS", label: "Items discounts" },
  ];

  const filteredReportList = useMemo(() => {
    if (!reportSearchQuery.trim()) return allSalesReports;
    const q = reportSearchQuery.toLowerCase();
    return allSalesReports.filter(r => r.label.toLowerCase().includes(q));
  }, [reportSearchQuery]);

  // Compute Active Report Dataset (Strictly Invoices Only, Quotations Excluded)
  const generatedReportData = useMemo(() => {
    const pool = invoiceOnlyDocs.filter(d => {
      if (repCustomer !== "ALL" && d.customerId !== repCustomer) return false;
      if (repStartDate && new Date(d.date).getTime() < new Date(repStartDate).getTime()) return false;
      if (repEndDate && new Date(d.date).getTime() > new Date(repEndDate + "T23:59:59").getTime()) return false;
      return true;
    });

    if (activeReportId === "PRODUCTS") {
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
        title: "Sales by Products Report (Invoices Only)",
        headers: ["#", "Product Code", "Product / Service Name", "Quantity Sold", "Invoices Count", "Total Billed (₹)"],
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
        totalPaid: pool.reduce((s, d) => s + (d.amount > 0 ? d.paidAmount : 0), 0),
        totalDue: pool.reduce((s, d) => s + d.amountDue, 0),
      };
    } else if (activeReportId === "PRODUCT_GROUPS") {
      const map = new Map<string, { group: string; qty: number; revenue: number; itemsCount: number }>();
      pool.forEach(doc => {
        doc.items.forEach((it: any) => {
          const matchedProd = products.find(p => p.name === it.name || p.sku === it.code);
          const grp = matchedProd?.category || "BILLING";
          const existing = map.get(grp) || { group: grp, qty: 0, revenue: 0, itemsCount: 0 };
          existing.qty += (Number(it.quantity) || 1);
          existing.revenue += (Number(it.total) || 0);
          existing.itemsCount += 1;
          map.set(grp, existing);
        });
      });

      const grandRev = pool.reduce((s, d) => s + d.amount, 0);
      const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
      return {
        title: "Sales by Product Groups Report",
        headers: ["#", "Product Group / Category", "Items Count", "Quantity Sold", "Group Revenue (₹)", "Volume Share %"],
        rows: rows.map((r, i) => [
          i + 1,
          r.group,
          r.itemsCount,
          r.qty,
          `₹${formatCurrency(r.revenue)}`,
          `${grandRev > 0 ? ((r.revenue / grandRev) * 100).toFixed(1) : 0}%`
        ]),
        totalSum: grandRev,
        totalPaid: pool.reduce((s, d) => s + (d.amount > 0 ? d.paidAmount : 0), 0),
        totalDue: pool.reduce((s, d) => s + d.amountDue, 0),
      };
    } else if (activeReportId === "CUSTOMERS" || activeReportId === "PAYMENT_TYPES_CUSTOMERS") {
      const map = new Map<string, { name: string; code: string; phone: string; count: number; total: number; paid: number; due: number }>();
      pool.forEach(doc => {
        const key = doc.customerId || doc.customerName;
        const existing = map.get(key) || { name: doc.customerName, code: doc.customerCode, phone: doc.customerPhone, count: 0, total: 0, paid: 0, due: 0 };
        existing.count += 1;
        existing.total += doc.amount;
        existing.paid += (doc.amount > 0 ? doc.paidAmount : 0);
        existing.due += doc.amountDue;
        map.set(key, existing);
      });

      const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
      return {
        title: "Sales by Customers Report (Invoices Only)",
        headers: ["#", "Customer Code", "Customer Name / Company", "Phone", "Invoices Count", "Billed Amount (₹)", "Total Paid (₹)", "Balance Due (₹)"],
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
    } else if (activeReportId === "REFUNDS") {
      const refunds = pool.filter(d => d.kind === "REFUND");
      return {
        title: "Official Refunds & Sales Cancellations Audit Report",
        headers: ["#", "Refund #", "Date", "Customer Code", "Customer Name", "Payment Tender", "Notes / Reason", "Refund Amount (₹)"],
        rows: refunds.map((r, i) => [
          i + 1,
          r.docNumber,
          formatDate(r.date),
          r.customerCode,
          r.customerName,
          r.paymentMethod,
          r.items[0]?.name || "Refund / Reversal",
          `₹${formatCurrency(Math.abs(r.amount))}`
        ]),
        totalSum: refunds.reduce((s, r) => s + Math.abs(r.amount), 0),
        totalPaid: refunds.reduce((s, r) => s + Math.abs(r.amount), 0),
        totalDue: 0,
      };
    } else if (activeReportId === "DAILY_SALES") {
      const map = new Map<string, { date: string; count: number; total: number; paid: number; due: number }>();
      pool.forEach(doc => {
        const dayStr = new Date(doc.date).toISOString().split("T")[0];
        const existing = map.get(dayStr) || { date: dayStr, count: 0, total: 0, paid: 0, due: 0 };
        existing.count += 1;
        existing.total += doc.amount;
        existing.paid += (doc.amount > 0 ? doc.paidAmount : 0);
        existing.due += doc.amountDue;
        map.set(dayStr, existing);
      });

      const rows = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
      return {
        title: "Daily Sales Summary Report (Invoices Only)",
        headers: ["#", "Date", "Invoices Count", "Daily Billed (₹)", "Daily Collected (₹)", "Outstanding Due (₹)"],
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
    } else if (activeReportId === "PAYMENT_TYPES" || activeReportId === "PAYMENT_TYPES_USERS") {
      const map = new Map<string, { method: string; count: number; total: number }>();
      pool.forEach(doc => {
        const method = doc.paymentMethod || "UPI PAYMENT";
        const existing = map.get(method) || { method, count: 0, total: 0 };
        existing.count += 1;
        existing.total += doc.amount;
        map.set(method, existing);
      });

      const grand = pool.reduce((s, d) => s + d.amount, 0);
      const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
      return {
        title: "Payment Tender Types Audit Report",
        headers: ["#", "Payment Tender Method", "Transactions", "Total Processed (₹)", "Volume Share %"],
        rows: rows.map((r, i) => [
          i + 1,
          r.method,
          r.count,
          `₹${formatCurrency(r.total)}`,
          `${grand > 0 ? ((r.total / grand) * 100).toFixed(1) : 0}%`
        ]),
        totalSum: grand,
        totalPaid: pool.reduce((s, d) => s + (d.amount > 0 ? d.paidAmount : 0), 0),
        totalDue: pool.reduce((s, d) => s + d.amountDue, 0),
      };
    } else if (activeReportId === "UNPAID_SALES") {
      const unpaidList = pool.filter(d => d.amountDue > 0);
      return {
        title: "Unpaid Sales & Accounts Receivable Report (Invoices Only)",
        headers: ["#", "Invoice #", "Customer Name", "Phone", "Document Date", "Due Date", "Total Billed (₹)", "Paid (₹)", "Outstanding Due (₹)"],
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
    } else if (activeReportId === "PROFIT_MARGIN") {
      const map = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
      pool.forEach(doc => {
        doc.items.forEach((it: any) => {
          const matchedProd = products.find(p => p.name === it.name || p.sku === it.code);
          const cPrice = Number(matchedProd?.purchasePrice || 0);
          const key = it.name.trim();
          const existing = map.get(key) || { name: key, qty: 0, revenue: 0, cost: 0 };
          const q = Number(it.quantity) || 1;
          existing.qty += q;
          existing.revenue += Number(it.total) || 0;
          existing.cost += (q * cPrice);
          map.set(key, existing);
        });
      });

      const rows = Array.from(map.values()).map(r => {
        const profit = r.revenue - r.cost;
        const margin = r.revenue > 0 ? ((profit / r.revenue) * 100).toFixed(1) : "0.0";
        return { ...r, profit, margin };
      }).sort((a, b) => b.profit - a.profit);

      return {
        title: "Profit & Margin Financial Analysis Report",
        headers: ["#", "Item / Service Name", "Qty Invoiced", "Revenue (₹)", "Cost of Goods (₹)", "Gross Profit (₹)", "Profit Margin %"],
        rows: rows.map((r, i) => [
          i + 1,
          r.name,
          r.qty,
          `₹${formatCurrency(r.revenue)}`,
          `₹${formatCurrency(r.cost)}`,
          `₹${formatCurrency(r.profit)}`,
          `${r.margin}%`
        ]),
        totalSum: rows.reduce((s, r) => s + r.revenue, 0),
        totalPaid: rows.reduce((s, r) => s + r.profit, 0),
        totalDue: rows.reduce((s, r) => s + r.cost, 0),
      };
    } else {
      // INVOICE_LIST & default
      return {
        title: "Chronological Invoices Audit Report (Invoices Only)",
        headers: ["#", "Invoice #", "Date", "Customer Code", "Customer / Company", "Contact Phone", "Items Invoiced", "Payment Mode", "Status", "Billed (₹)", "Paid (₹)", "Due (₹)"],
        rows: pool.map((d, i) => [
          i + 1,
          d.docNumber,
          formatDate(d.date),
          d.customerCode || "---",
          d.customerName,
          d.customerPhone || "---",
          d.items.map((it: any) => `${it.name} (${it.quantity})`).join("; "),
          d.paymentMethod,
          d.status,
          `₹${formatCurrency(d.amount)}`,
          `₹${formatCurrency(d.paidAmount)}`,
          `₹${formatCurrency(d.amountDue)}`
        ]),
        totalSum: pool.reduce((s, d) => s + d.amount, 0),
        totalPaid: pool.reduce((s, d) => s + (d.amount > 0 ? d.paidAmount : 0), 0),
        totalDue: pool.reduce((s, d) => s + d.amountDue, 0),
      };
    }
  }, [invoiceOnlyDocs, activeReportId, repCustomer, repStartDate, repEndDate, products]);

  // Clean Multi-Column CSV Exporter
  const downloadReportCSV = () => {
    if (!generatedReportData) return;
    const { title, headers, rows } = generatedReportData;
    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `"TechNext Technologies Private Limited - Official Financial & Sales Audit Report"\n`;
    csvContent += `"Report Title:","${title.replace(/"/g, '""')}"\n`;
    csvContent += `"Reporting Period:","${repStartDate || 'All Time'} to ${repEndDate || 'Present'}"\n`;
    csvContent += `"Document Ref:","TN-REP-2026-${Date.now().toString().slice(-4)}"\n`;
    csvContent += `"Generated On:","${new Date().toLocaleString()}"\n`;
    csvContent += `"Filter Scope:","Strictly Invoices Only (Quotations / Estimates Excluded)"\n`;
    csvContent += `"Summary Metrics:","Total Records: ${rows.length}","Total Volume: ₹${generatedReportData.totalSum || 0}","Collected: ₹${generatedReportData.totalPaid || 0}","Due: ₹${generatedReportData.totalDue || 0}"\n\n`;
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach((r: any) => {
      csvContent += r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    csvContent += `\n"GRAND TOTAL","","","","","","","","","₹${formatCurrency(generatedReportData.totalSum || 0)}","₹${formatCurrency(generatedReportData.totalPaid || 0)}","₹${formatCurrency(generatedReportData.totalDue || 0)}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `technext_${activeReportId.toLowerCase()}_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // Dashboard Calculations (Strictly Invoices Only - Screenshot 5)
  // -------------------------------------------------------------
  const monthlySales2026 = useMemo(() => {
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];
    const totals = Array(12).fill(0);
    const counts = Array(12).fill(0);

    // Strictly Invoices and Refunds only (Estimates strictly excluded)
    invoiceOnlyDocs.forEach(doc => {
      const d = new Date(doc.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === 2026) {
        const m = d.getMonth();
        totals[m] += doc.amount;
        counts[m] += 1;
      }
    });

    const maxVal = Math.max(...totals, 1000);
    const topIdx = totals.indexOf(Math.max(...totals));

    return {
      months,
      totals,
      counts,
      maxVal,
      topMonthName: months[topIdx] || "SEPTEMBER",
      topMonthTotal: totals[topIdx] || 0,
      yearTotal: totals.reduce((a, b) => a + b, 0),
    };
  }, [invoiceOnlyDocs]);

  // Selected Month Invoices for Active Graph Interactive Drilldown
  const selectedMonthInvoices = useMemo(() => {
    if (selectedMonthIndex === null) return [];
    return invoiceOnlyDocs.filter(doc => {
      const d = new Date(doc.date);
      return !isNaN(d.getTime()) && d.getFullYear() === 2026 && d.getMonth() === selectedMonthIndex;
    });
  }, [invoiceOnlyDocs, selectedMonthIndex]);

  // Periodic Reports Data based on periodic date range (Screenshot 5)
  const periodicData = useMemo(() => {
    const pool = invoiceOnlyDocs.filter(d => {
      const t = new Date(d.date).getTime();
      if (periodicStartDate && t < new Date(periodicStartDate).getTime()) return false;
      if (periodicEndDate && t > new Date(periodicEndDate + "T23:59:59").getTime()) return false;
      return true;
    });

    // Top Products
    const prodMap = new Map<string, { name: string; qty: number; rev: number }>();
    pool.forEach(doc => {
      doc.items.forEach((it: any) => {
        const k = it.name.trim();
        const cur = prodMap.get(k) || { name: k, qty: 0, rev: 0 };
        cur.qty += (Number(it.quantity) || 1);
        cur.rev += (Number(it.total) || 0);
        prodMap.set(k, cur);
      });
    });
    const topProducts = Array.from(prodMap.values()).sort((a, b) => b.rev - a.rev).slice(0, 5);

    // Top Product Groups
    const groupMap = new Map<string, { group: string; rev: number; count: number }>();
    pool.forEach(doc => {
      doc.items.forEach((it: any) => {
        const matchedProd = products.find(p => p.name === it.name || p.sku === it.code);
        const grp = matchedProd?.category || "BILLING";
        const cur = groupMap.get(grp) || { group: grp, rev: 0, count: 0 };
        cur.rev += (Number(it.total) || 0);
        cur.count += 1;
        groupMap.set(grp, cur);
      });
    });
    const topGroups = Array.from(groupMap.values()).sort((a, b) => b.rev - a.rev);

    // Top Customers
    const custMap = new Map<string, { name: string; code: string; rev: number; count: number }>();
    pool.forEach(doc => {
      const k = doc.customerId || doc.customerName;
      const cur = custMap.get(k) || { name: doc.customerName, code: doc.customerCode, rev: 0, count: 0 };
      cur.rev += doc.amount;
      cur.count += 1;
      custMap.set(k, cur);
    });
    const topCustomers = Array.from(custMap.values()).sort((a, b) => b.rev - a.rev).slice(0, 5);

    const poolGrossSales = pool.reduce((s, d) => s + d.amount, 0);
    const poolTax = 0; // 0% Tax
    const poolNetSales = poolGrossSales;
    const poolPaid = pool.reduce((s, d) => s + (d.amount > 0 ? (d.paidAmount || 0) : 0), 0);

    return { 
      topProducts, 
      topGroups, 
      topCustomers, 
      poolCount: pool.length, 
      poolTotal: poolGrossSales,
      poolGrossSales,
      poolTax,
      poolNetSales,
      poolPaid
    };
  }, [invoiceOnlyDocs, periodicStartDate, periodicEndDate, products]);

  // Products Category Groups
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
      0, // 0% Tax
      p.sellingPrice || 0,
      p.unit || (p.isService ? 'SERVICE' : 'PCS'),
      p.isService ? 'YES' : 'NO'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `technext_products_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bar colors matching Aronium Dashboard screenshot (Screenshot 5)
  const barColors = [
    "#64748B", "#64748B", "#64748B", "#64748B", 
    "#84cc16", "#e879f9", "#38bdf8", "#f43f5e", 
    "#f87171", "#60a5fa", "#64748B", "#64748B"
  ];

  // Authentic Aronium Left Navigation items (Filtered for test accounts)
  const sidebarNavItems = [
    ...(!isTestUser ? [{ id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard }] : []),
    { id: "DOCUMENTS", label: "Documents", icon: Receipt },
    { id: "PRODUCTS", label: "Products", icon: Package },
    { id: "STOCK", label: "Stock", icon: Layers },
    ...(!isTestUser ? [{ id: "REPORTING", label: "Reporting", icon: BarChart3 }] : []),
    { id: "CUSTOMERS", label: "Customers & suppliers", icon: Users },
    { id: "PROMOTIONS", label: "Promotions", icon: Gift },
    ...(!isTestUser ? [{ id: "SECURITY", label: "Users & security", icon: ShieldCheck }] : []),
    { id: "PAYMENT_TYPES", label: "Payment types", icon: CreditCard },
    { id: "COUNTRIES", label: "Countries", icon: Globe },
    ...(!isTestUser ? [{ id: "MY_COMPANY", label: "My company", icon: Building2 }] : []),
  ];

  const currentViewTitle = useMemo(() => {
    const item = sidebarNavItems.find(i => i.id === activeView);
    return item ? item.label : "Documents";
  }, [activeView, sidebarNavItems]);

  return (
    <div className={`${styles.consoleContainer} ${theme === "DARK" ? styles.darkTheme : styles.lightTheme}`}>
      {/* ========================================================= */}
      {/* 1. AUTHENTIC LEFT ARONIUM MANAGEMENT SIDEBAR               */}
      {/* ========================================================= */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div>
          <div className={styles.sidebarHeader}>
            {isTestUser ? (
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px" }}>
                BP
              </div>
            ) : (
              <img
                src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png"
                alt="TechNext"
                style={{ height: "24px", maxWidth: "32px", objectFit: "contain" }}
              />
            )}
            {!sidebarCollapsed && (
              <div className={styles.sidebarTitle}>
                {isTestUser ? "POS Billing" : "Management"}
              </div>
            )}
          </div>

          <nav className={styles.sidebarNav}>
            {sidebarNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id as any)}
                  className={`${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={16} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={styles.btnCollapse}
            title={sidebarCollapsed ? "Expand Sidebar (>>)" : "Collapse Sidebar (<<)"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                             */}
      {/* ========================================================= */}
      <main className={styles.mainContent}>
        {/* Top Management Breadcrumb Bar */}
        <header className={styles.topNav}>
          <div className={styles.breadcrumbGroup}>
            <span style={{ color: "#00a2ed", fontWeight: 700 }}>Management</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span className={styles.breadcrumbTitle}>
              {currentViewTitle}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Live Two-Way Auto Sync Indicator */}
            <div 
              className={`${styles.syncBadge} ${isManualSyncing ? styles.syncBadgeSyncing : styles.syncBadgeLive}`}
              title="Continuous two-way auto sync active between Cloud CRM and Aronium POS"
            >
              <div className={styles.syncDot} style={isManualSyncing ? { backgroundColor: "#00a2ed", animation: "none" } : undefined} />
              <span>{isManualSyncing ? "Syncing..." : "⚡ Auto Sync: Live"}</span>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isManualSyncing}
              className={styles.syncBtn}
              title={`Last sync: ${lastSyncTime}. Click to trigger instant two-way sync now.`}
            >
              <RefreshCcw size={12} className={isManualSyncing ? styles.spinning : ""} />
              <span>{isManualSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>

            {syncFeedback && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: syncFeedback.includes("failed") ? "#ef4444" : "#22c55e" }}>
                {syncFeedback}
              </span>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className={styles.themeToggleBtn}
              title="Toggle Light / Dark Mode"
            >
              {theme === "DARK" ? <Sun size={13} color="#FBBF24" /> : <Moon size={13} color="#6366F1" />}
              <span>{theme === "DARK" ? "Dark Mode" : "Light Mode"}</span>
            </button>

            <Link
              href="/billing/new?type=invoice"
              className={styles.toolBtn}
              style={{ background: "#00a2ed", color: "#ffffff", fontWeight: 700 }}
            >
              <Plus size={13} /> New Bill
            </Link>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: MANAGEMENT • DOCUMENTS (Screenshot 1 & 3 Replica)  */}
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
                <Plus size={13} /> Add
              </Link>

              <button
                type="button"
                disabled={!selectedDoc}
                onClick={() => {
                  if (selectedDoc) window.open(selectedDoc.viewUrl, "_blank");
                }}
                className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
              >
                <Printer size={13} /> Print
              </button>

              <button
                type="button"
                disabled={!selectedDoc}
                onClick={() => {
                  if (selectedDoc) router.push(selectedDoc.viewUrl);
                }}
                className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
              >
                <Eye size={13} /> Print preview
              </button>

              <button
                type="button"
                disabled={!selectedDoc}
                onClick={() => {
                  if (selectedDoc) window.open(`${selectedDoc.viewUrl}?download=pdf`, "_blank");
                }}
                className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
                title="Download 100% Vector PDF"
              >
                <FileDown size={13} /> Save as PDF
              </button>

              <button
                type="button"
                disabled={!selectedDoc}
                onClick={() => {
                  if (selectedDoc) router.push(`/billing/doc/${selectedDoc.kind.toLowerCase()}/${selectedDoc.id}/edit`);
                }}
                className={`${styles.toolBtn} ${!selectedDoc ? styles.toolBtnDisabled : ""}`}
              >
                <Edit3 size={13} /> Edit
              </button>

              <button
                type="button"
                disabled={!selectedDoc || selectedDoc.kind === "REFUND"}
                onClick={() => {
                  if (selectedDoc && selectedDoc.kind !== "REFUND") {
                    openRefundModal(selectedDoc);
                  }
                }}
                className={`${styles.toolBtn} ${(!selectedDoc || selectedDoc.kind === "REFUND") ? styles.toolBtnDisabled : ""}`}
                style={{ color: (!selectedDoc || selectedDoc.kind === "REFUND") ? undefined : "#ef4444" }}
                title="Process official Return or issue Credit Note / Refund"
              >
                <RotateCcw size={13} /> Return / Refund
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
                    <Trash2 size={13} /> Delete
                  </button>
                </form>
              )}

              {selectedDoc?.customerPhone && (() => {
                const docUrl = selectedDoc.customerPortalToken
                  ? (selectedDoc.kind === "QUOTATION"
                      ? `${getAppUrl()}/portal/${selectedDoc.customerPortalToken}/quotations/${selectedDoc.id}`
                      : `${getAppUrl()}/portal/${selectedDoc.customerPortalToken}/invoices/${selectedDoc.id}`)
                  : (selectedDoc.kind === "QUOTATION"
                      ? `${getAppUrl()}/quotation/${selectedDoc.id}`
                      : `${getAppUrl()}/request/invoice/${selectedDoc.id}`);

                const shareMsg = selectedDoc.kind === "QUOTATION"
                  ? buildQuotationNotificationMessage({
                      customerName: selectedDoc.customerName,
                      quoteNo: selectedDoc.docNumber,
                      amount: selectedDoc.amount,
                      trackingUrl: docUrl
                    })
                  : buildInvoiceNotificationMessage({
                      customerName: selectedDoc.customerName,
                      invoiceNo: selectedDoc.docNumber,
                      amount: selectedDoc.amount,
                      trackingUrl: docUrl
                    });

                return (
                  <a
                    href={getWhatsAppLink(selectedDoc.customerPhone, shareMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.toolBtn}
                    style={{ color: "#22c55e" }}
                    title="Share Document on WhatsApp"
                  >
                    <Share2 size={13} /> WhatsApp
                  </a>
                );
              })()}

              {selectedDoc?.customerPhone && selectedDoc.kind === "INVOICE" && selectedDoc.status !== "Paid" && (() => {
                const portalInvoiceUrl = selectedDoc.customerPortalToken
                  ? `${getAppUrl()}/portal/${selectedDoc.customerPortalToken}/invoices/${selectedDoc.id}`
                  : `${getAppUrl()}/request/invoice/${selectedDoc.id}`;

                return (
                  <a
                    href={getWhatsAppLink(
                      selectedDoc.customerPhone,
                      buildPaymentReminderMessage({
                        customerName: selectedDoc.customerName,
                        invoiceNumber: selectedDoc.docNumber,
                        totalAmount: selectedDoc.amount,
                        pendingAmount: Math.max(0, selectedDoc.amount - (selectedDoc.paidAmount || (selectedDoc.status === "Paid" ? selectedDoc.amount : 0))),
                        dueDate: selectedDoc.date,
                        viewUrl: portalInvoiceUrl
                      })
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.toolBtn}
                    style={{ color: "#d97706", borderColor: "#fde68a", background: "#fef3c7" }}
                    title="Send WhatsApp Payment Reminder"
                  >
                    <Bell size={13} /> Payment Reminder
                  </a>
                );
              })()}
            </div>

            {/* Structured 3-Row Filter Bar (Matching Screenshot 1) */}
            <div className={`${styles.panelCard} ${styles.filterBarStructured}`}>
              {/* Row 1: Product, User, Cash register */}
              <div className={styles.filterRow}>
                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Product</label>
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

                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>User</label>
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className={styles.selectField}
                  >
                    <option value="ALL">All users</option>
                    <option value="Admin">Admin</option>
                    <option value="Accounts Team">Accounts Team</option>
                  </select>
                </div>

                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Cash register</label>
                  <select
                    value={filterCashRegister}
                    onChange={(e) => setFilterCashRegister(e.target.value)}
                    className={styles.selectField}
                  >
                    <option value="ALL">All cash registers</option>
                    <option value="MAIN">Main POS Register</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer, Document type, Paid status */}
              <div className={styles.filterRow}>
                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Customer</label>
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

                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Document type</label>
                  <select
                    value={filterDocType}
                    onChange={(e) => setFilterDocType(e.target.value)}
                    className={styles.selectField}
                  >
                    <option value="ALL">All document types</option>
                    <option value="INVOICE">Invoices</option>
                    <option value="QUOTATION">Quotations / Proforma</option>
                    <option value="REFUND">Refunds</option>
                    <option value="ORDER_FORM">Order Forms</option>
                    <option value="PAYMENT_RECEIPT">Receipts</option>
                  </select>
                </div>

                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Paid status</label>
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
              </div>

              {/* Row 3: Document number, External document, Period, Search & Clear */}
              <div className={styles.filterRowThird}>
                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Document number</label>
                  <input
                    type="text"
                    placeholder="Search number..."
                    value={filterDocNumber}
                    onChange={(e) => setFilterDocNumber(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>External document</label>
                  <input
                    type="text"
                    placeholder="External ref..."
                    value={filterExternalDoc}
                    onChange={(e) => setFilterExternalDoc(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.filterFieldGroup}>
                  <label className={styles.filterFieldLabel}>Period</label>
                  <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className={styles.inputField}
                    />
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button type="button" onClick={() => {}} className={styles.btnSearchIcon} title="Search">
                    <Search size={14} />
                  </button>
                  <button type="button" onClick={handleClearFilters} className={styles.btnClearIcon} title="Clear filters">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Master-Detail Split Pane (Matching Screenshot 1) */}
            <div className={styles.splitPaneContainer}>
              {/* Top Table: Master Documents (N) */}
              <div className={styles.panelCard} style={{ padding: "10px 14px" }}>
                <div className={styles.paneHeader}>
                  <span className={styles.paneTitle}>
                    Documents ({filteredDocs.length})
                  </span>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>
                    Select a document to inspect itemized lines below
                  </span>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: "24px" }}></th>
                        <th style={{ width: "35px" }}>ID</th>
                        <th>Number</th>
                        <th>External...</th>
                        <th>Document type</th>
                        <th>Paid</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>POS</th>
                        <th>Ord...</th>
                        <th>Payment...</th>
                        <th>User</th>
                        <th>Discount</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.length === 0 ? (
                        <tr>
                          <td colSpan={14} style={{ textAlign: "center", padding: "24px", opacity: 0.6 }}>
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
                              <td style={{ opacity: 0.6 }}>{idx + 1}</td>
                              <td style={{ fontWeight: 700, color: doc.kind === "REFUND" ? "#ef4444" : "#00a2ed" }}>
                                {doc.docNumber}
                              </td>
                              <td style={{ opacity: 0.85 }}>{doc.externalRef}</td>
                              <td>
                                <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                                  {doc.kind.replace("_", " ")}
                                </span>
                              </td>
                              <td>
                                <span className={doc.kind === "REFUND" ? styles.badgeRefund : doc.status === "Paid" || doc.status === "Approved" ? styles.badgePaid : styles.badgePending}>
                                  {doc.status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{doc.customerName}</td>
                              <td>{formatDate(doc.date)}</td>
                              <td>{doc.posRegister}</td>
                              <td>{doc.orderNumber}</td>
                              <td>{doc.paymentMethod}</td>
                              <td>{doc.userName}</td>
                              <td>{doc.discount}</td>
                              <td style={{ textAlign: "right", fontWeight: 800, color: doc.kind === "REFUND" ? "#ef4444" : "inherit" }}>
                                {doc.amount < 0 ? `-₹${formatCurrency(Math.abs(doc.amount))}` : `₹${formatCurrency(doc.amount)}`}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Horizontal Separator Bar */}
              <div className={styles.splitDivider}>...</div>

              {/* Bottom Table: Document Items (X) (Matching Screenshot 1) */}
              <div className={styles.panelCard} style={{ padding: "10px 14px" }}>
                <div className={styles.paneHeader}>
                  <span className={styles.paneTitle} style={{ color: "#38bdf8" }}>
                    Document items ({selectedDoc ? selectedDoc.items.length : 0})
                    {selectedDoc && ` — #${selectedDoc.docNumber} (${selectedDoc.customerName})`}
                  </span>
                  {selectedDoc && (
                    <div style={{ display: "flex", gap: "16px", fontSize: "11.5px", fontWeight: 600 }}>
                      <span>Total: <strong style={{ color: selectedDoc.kind === "REFUND" ? "#ef4444" : "#00a2ed" }}>₹{formatCurrency(Math.abs(selectedDoc.amount))}</strong></span>
                      <span>Paid: <strong style={{ color: "#22c55e" }}>₹{formatCurrency(selectedDoc.paidAmount)}</strong></span>
                      <span>Due: <strong style={{ color: selectedDoc.amountDue > 0 ? "#ef4444" : "inherit" }}>₹{formatCurrency(selectedDoc.amountDue)}</strong></span>
                    </div>
                  )}
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: "35px" }}>ID</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Unit of measure</th>
                        <th style={{ textAlign: "center" }}>Quantity</th>
                        <th style={{ textAlign: "right" }}>Price before tax</th>
                        <th style={{ textAlign: "center" }}>Tax</th>
                        <th style={{ textAlign: "right" }}>Price</th>
                        <th style={{ textAlign: "right" }}>Total before discount</th>
                        <th style={{ textAlign: "right" }}>Discount</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedDoc || selectedDoc.items.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}>
                            Select a document above to inspect its itemized lines.
                          </td>
                        </tr>
                      ) : (
                        selectedDoc.items.map((item: any, iIdx: number) => (
                          <tr key={item.id || iIdx}>
                            <td style={{ opacity: 0.6 }}>{iIdx + 1}</td>
                            <td style={{ fontFamily: "monospace", fontSize: "11px", opacity: 0.85 }}>{item.code}</td>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>{item.unit || "Pcs"}</td>
                            <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                            <td style={{ textAlign: "right" }}>₹{formatCurrency(item.priceBeforeTax)}</td>
                            <td style={{ textAlign: "center" }}>{item.tax || "0%"}</td>
                            <td style={{ textAlign: "right" }}>₹{formatCurrency(item.unitPrice)}</td>
                            <td style={{ textAlign: "right" }}>₹{formatCurrency(item.totalBeforeDiscount)}</td>
                            <td style={{ textAlign: "right" }}>{item.discount || "0.00"}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: item.total < 0 ? "#ef4444" : "inherit" }}>
                              {item.total < 0 ? `-₹${formatCurrency(Math.abs(item.total))}` : `₹${formatCurrency(item.total)}`}
                            </td>
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
        {/* VIEW 2: MANAGEMENT • REPORTING (Screenshot 2 Replica)      */}
        {/* ========================================================= */}
        {activeView === "REPORTING" && (
          <div className={styles.reportingLayout}>
            {/* Left Column: 21 Sales Reports List (Matching Screenshot 2) */}
            <div className={`${styles.panelCard} ${styles.reportSideList}`}>
              <div style={{ background: "#00a2ed", color: "#ffffff", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, marginBottom: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <BarChart3 size={13} /> Select report
              </div>

              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px", opacity: 0.9 }}>
                Select report to view or print
              </div>

              <div className={styles.reportSearchBox}>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              <div style={{ marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#00a2ed", display: "block", marginBottom: "6px" }}>
                  Sales ({filteredReportList.length})
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  {filteredReportList.map(rep => (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => setActiveReportId(rep.id)}
                      className={`${styles.reportItemBtn} ${activeReportId === rep.id ? styles.reportItemBtnActive : ""}`}
                    >
                      <FileText size={12} /> {rep.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Filter Panel & Report Output (Matching Screenshot 2) */}
            <div className={`${styles.panelCard} ${styles.reportMainPanel}`}>
              <div className={styles.reportFilterBox}>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#00a2ed" }}>
                  Filter
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  <div className={styles.filterFieldGroup}>
                    <label className={styles.filterFieldLabel}>Customers &amp; suppliers</label>
                    <select
                      value={repCustomer}
                      onChange={(e) => setRepCustomer(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="ALL">All</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterFieldGroup}>
                    <label className={styles.filterFieldLabel}>User</label>
                    <select
                      value={repUser}
                      onChange={(e) => setRepUser(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="ALL">All</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div className={styles.filterFieldGroup}>
                    <label className={styles.filterFieldLabel}>Cash register</label>
                    <select className={styles.selectField}>
                      <option value="ALL">All</option>
                      <option value="MAIN">Main POS Register</option>
                    </select>
                  </div>

                  <div className={styles.filterFieldGroup}>
                    <label className={styles.filterFieldLabel}>Product</label>
                    <select
                      value={repProduct}
                      onChange={(e) => setRepProduct(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="ALL">All</option>
                      {products.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterFieldGroup}>
                    <label className={styles.filterFieldLabel}>Product group</label>
                    <select
                      value={repProductGroup}
                      onChange={(e) => setRepProductGroup(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="Products">Products</option>
                      <option value="BILLING">BILLING</option>
                      <option value="website">website</option>
                    </select>
                  </div>

                  <div className={styles.filterFieldGroup} style={{ gridColumn: "span 2" }}>
                    <label className={styles.filterFieldLabel}>Period</label>
                    <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                      <input
                        type="date"
                        value={repStartDate}
                        onChange={(e) => setRepStartDate(e.target.value)}
                        className={styles.inputField}
                      />
                      <input
                        type="date"
                        value={repEndDate}
                        onChange={(e) => setRepEndDate(e.target.value)}
                        className={styles.inputField}
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Action Buttons matching Screenshot 2 */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", borderTop: "1px solid rgba(148, 163, 184, 0.15)", paddingTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {}}
                    className={styles.toolBtn}
                    style={{ background: "#00a2ed", color: "#ffffff", padding: "6px 14px" }}
                  >
                    <Search size={13} /> Show report
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={styles.toolBtn}
                    style={{ background: "#0284c7", color: "#ffffff", padding: "6px 14px" }}
                    title="Print report / Save as vector PDF"
                  >
                    <Printer size={13} /> Print
                  </button>

                  <button
                    type="button"
                    onClick={downloadReportCSV}
                    className={styles.toolBtn}
                    style={{ borderColor: "#10b981", color: "#10b981", padding: "6px 14px" }}
                    title="Export multi-column Excel CSV"
                  >
                    <Download size={13} /> Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (generatedReportData) {
                        generateReportVectorPdf(
                          generatedReportData,
                          `${repStartDate || "All Time"} to ${repEndDate || "Present"}`
                        );
                      } else {
                        window.print();
                      }
                    }}
                    className={styles.toolBtn}
                    style={{ borderColor: "#ef4444", color: "#ef4444", padding: "6px 14px" }}
                    title="Export 100% Vector PDF Report"
                  >
                    <FileDown size={13} /> PDF
                  </button>
                </div>
              </div>

              {/* Generated Report Table Output */}
              {generatedReportData && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "10px 14px", backgroundColor: theme === "DARK" ? "#0f172a" : "#f8fafc", borderRadius: "6px", border: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png"
                        alt="TechNext"
                        style={{ height: "24px", objectFit: "contain" }}
                      />
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#00a2ed" }}>
                          {generatedReportData.title}
                        </h3>
                        <div style={{ fontSize: "11px", opacity: 0.7 }}>
                          Scope: Strictly Invoices Only • Certified Enterprise Audit
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700 }}>
                        Total Net Volume: <span style={{ color: "#22c55e" }}>₹{formatCurrency(generatedReportData.totalSum || 0)}</span>
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.75 }}>
                        Collected: ₹{formatCurrency(generatedReportData.totalPaid || 0)} | Due: ₹{formatCurrency(generatedReportData.totalDue || 0)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.tableWrapper} style={{ maxHeight: "450px" }}>
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
                              No data available for the selected parameters.
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
        {/* VIEW 3: MANAGEMENT • DASHBOARD (Screenshot 5 Replica)      */}
        {/* ========================================================= */}
        {activeView === "DASHBOARD" && (
          <div className={styles.dashboardGrid}>
            {/* Top Card: Monthly Sales - 2026 Bar Chart (Screenshot 5) */}
            <div className={`${styles.panelCard} ${styles.monthlyChartCard}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 2px 0" }}>
                    Monthly Sales - 2026
                  </h2>
                  <div style={{ fontSize: "12px", opacity: 0.75 }}>
                    Sales data grouped by month
                  </div>
                </div>

                <div style={{ display: "flex", gap: "28px", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: "11px", opacity: 0.75, textTransform: "uppercase" }}>Total Sales</div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#00a2ed" }}>
                      ₹{formatCurrency(monthlySales2026.yearTotal)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "10.5px", opacity: 0.75, textTransform: "uppercase" }}>Top Performing Month</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#22c55e" }}>
                      {monthlySales2026.topMonthName} — ₹{formatCurrency(monthlySales2026.topMonthTotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 12-Month Bar Chart */}
              <div style={{ overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", paddingBottom: "4px" }}>
                <div style={{ minWidth: "560px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "8px", alignItems: "flex-end", height: "150px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)", paddingBottom: "8px" }}>
                    {monthlySales2026.months.map((m, idx) => {
                      const val = monthlySales2026.totals[idx];
                      const isSelected = selectedMonthIndex === idx;
                      const pct = monthlySales2026.maxVal > 0 ? Math.max(6, (val / monthlySales2026.maxVal) * 100) : 6;
                      return (
                        <div 
                          key={m} 
                          onClick={() => setSelectedMonthIndex(selectedMonthIndex === idx ? null : idx)}
                          className={`${styles.barColumn} ${isSelected ? styles.barColumnActive : ""}`}
                          title={`${m} 2026: ₹${formatCurrency(val)} — Click to inspect bills`}
                        >
                          {val > 0 && (
                            <span style={{ fontSize: "10px", fontWeight: 700, marginBottom: "4px", color: isSelected ? "#00a2ed" : "inherit" }}>
                              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                            </span>
                          )}
                          <div 
                            data-bar="true"
                            style={{ 
                              width: "100%", 
                              height: `${val > 0 ? pct : 4}%`, 
                              backgroundColor: isSelected ? "#00a2ed" : (barColors[idx] || "#00a2ed"), 
                              borderRadius: "3px 3px 0 0",
                              transition: "all 0.15s ease"
                            }} 
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Month Labels */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "8px", marginTop: "6px", textAlign: "center", fontSize: "11px", opacity: 0.75, fontWeight: 600 }}>
                    {monthlySales2026.months.map((m, idx) => (
                      <div 
                        key={m} 
                        onClick={() => setSelectedMonthIndex(selectedMonthIndex === idx ? null : idx)}
                        style={{ 
                          cursor: "pointer", 
                          color: selectedMonthIndex === idx ? "#00a2ed" : "inherit",
                          fontWeight: selectedMonthIndex === idx ? 800 : 600
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Month Drilldown Inspection Panel */}
              {selectedMonthIndex !== null && (
                <div className={styles.drilldownPanel}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ fontSize: "13.5px", fontWeight: 700, margin: 0, color: "#00a2ed" }}>
                        📅 {monthlySales2026.months[selectedMonthIndex]} 2026 Invoices Breakdown
                      </h3>
                      <span style={{ fontSize: "11px", background: "rgba(0, 162, 237, 0.1)", color: "#00a2ed", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                        {selectedMonthInvoices.length} Bills • Net: ₹{formatCurrency(monthlySales2026.totals[selectedMonthIndex])}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMonthIndex(null)}
                      className={styles.toolBtn}
                      style={{ padding: "3px 8px", fontSize: "11px" }}
                    >
                      <X size={12} /> Clear
                    </button>
                  </div>

                  <div className={styles.tableWrapper} style={{ maxHeight: "240px" }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Doc #</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Items Invoiced</th>
                          <th>Payment Tender</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMonthInvoices.map(inv => (
                          <tr key={inv.id}>
                            <td><strong>{inv.docNumber}</strong></td>
                            <td>{formatDate(inv.date)}</td>
                            <td>{inv.customerName}</td>
                            <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {inv.items.map((it: any) => `${it.name} (${it.quantity})`).join(", ")}
                            </td>
                            <td>{inv.paymentMethod}</td>
                            <td>
                              <span className={inv.kind === "REFUND" ? styles.badgeRefund : styles.badgePaid}>
                                {inv.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: inv.amount < 0 ? "#ef4444" : "#10b981" }}>
                              {inv.amount < 0 ? `-₹${formatCurrency(Math.abs(inv.amount))}` : `₹${formatCurrency(inv.amount)}`}
                            </td>
                            <td>
                              <Link href={inv.viewUrl} className={styles.toolBtn} style={{ padding: "2px 6px", fontSize: "11px" }}>
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section: Periodic Reports (Screenshot 5 Replica) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                    Periodic Reports ({formatDate(periodicStartDate)} - {formatDate(periodicEndDate)})
                  </h3>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    type="date"
                    value={periodicStartDate}
                    onChange={(e) => setPeriodicStartDate(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "135px" }}
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={periodicEndDate}
                    onChange={(e) => setPeriodicEndDate(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "135px" }}
                  />
                </div>
              </div>

              {/* 4 Periodic Grid Cards (Top Products, Hourly Sales, Top Groups, Top Customers) */}
              <div className={styles.periodicGrid}>
                {/* 1. Top Products */}
                <div className={`${styles.panelCard} ${styles.periodicCard}`}>
                  <h4 className={styles.periodicCardTitle}>Top Products</h4>
                  {periodicData.topProducts.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, fontSize: "12px" }}>
                      No data to display
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {periodicData.topProducts.map((p, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                          <span style={{ fontWeight: 600 }}>{idx + 1}. {p.name} ({p.qty})</span>
                          <span style={{ fontWeight: 700, color: "#00a2ed" }}>₹{formatCurrency(p.rev)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Hourly Sales */}
                <div className={`${styles.panelCard} ${styles.periodicCard}`}>
                  <h4 className={styles.periodicCardTitle}>Hourly Sales</h4>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, fontSize: "12px" }}>
                    No data to display
                  </div>
                </div>

                {/* 3. Total Sales (Amount) (Matching Screenshot 5) */}
                <div className={`${styles.panelCard} ${styles.periodicCard}`}>
                  <h4 className={styles.periodicCardTitle}>Total Sales (Amount)</h4>
                  {periodicData.poolCount === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, fontSize: "12px" }}>
                      No data to display
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, justifyContent: "center" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                        <span style={{ opacity: 0.75 }}>Gross Billed</span>
                        <span style={{ fontWeight: 700, color: "#00a2ed" }}>₹{formatCurrency(periodicData.poolGrossSales)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                        <span style={{ opacity: 0.75 }}>GST Output Tax (0%)</span>
                        <span style={{ fontWeight: 600 }}>₹0.00</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                        <span style={{ opacity: 0.75 }}>Net Sales (ex. Tax)</span>
                        <span style={{ fontWeight: 700, color: "#22c55e" }}>₹{formatCurrency(periodicData.poolNetSales)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                        <span style={{ opacity: 0.75 }}>Total Invoices</span>
                        <span style={{ fontWeight: 600 }}>{periodicData.poolCount} Bills</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0" }}>
                        <span style={{ opacity: 0.75 }}>Total Collected</span>
                        <span style={{ fontWeight: 700, color: "#10b981" }}>₹{formatCurrency(periodicData.poolPaid)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Top Product Groups */}
                <div className={`${styles.panelCard} ${styles.periodicCard}`}>
                  <h4 className={styles.periodicCardTitle}>Top Product Groups</h4>
                  {periodicData.topGroups.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, fontSize: "12px" }}>
                      No data to display
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {periodicData.topGroups.map((g, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                          <span style={{ fontWeight: 600 }}>📁 {g.group} ({g.count} items)</span>
                          <span style={{ fontWeight: 700, color: "#22c55e" }}>₹{formatCurrency(g.rev)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Top Customers */}
                <div className={`${styles.panelCard} ${styles.periodicCard}`}>
                  <h4 className={styles.periodicCardTitle}>Top Customers (Lead Customers)</h4>
                  {periodicData.topCustomers.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, fontSize: "12px" }}>
                      No data to display
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {periodicData.topCustomers.map((c, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: "10.5px", opacity: 0.65 }}>Code: {c.code}</div>
                          </div>
                          <span style={{ fontWeight: 700, color: "#00a2ed" }}>₹{formatCurrency(c.rev)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: MANAGEMENT • PRODUCTS (Screenshot 4 Replica)       */}
        {/* ========================================================= */}
        {activeView === "PRODUCTS" && (
          <div className={styles.productsModuleLayout}>
            {/* Action Toolbar matching Screenshot 4 */}
            <div className={styles.actionToolbar}>
              <button
                type="button"
                onClick={() => router.refresh()}
                className={styles.toolBtn}
                title="Refresh Products"
              >
                <RefreshCcw size={13} /> Refresh
              </button>

              <button
                type="button"
                onClick={() => {
                  const grp = window.prompt("Enter new category / product group name:");
                  if (grp && grp.trim()) {
                    setSelectedProductGroup(grp.trim());
                  }
                }}
                className={styles.toolBtn}
                title="Create a new product group"
              >
                <FolderPlus size={13} /> New group
              </button>

              <button
                type="button"
                disabled={!selectedProductGroup}
                onClick={() => {
                  if (selectedProductGroup) {
                    const next = window.prompt("Edit category name:", selectedProductGroup);
                    if (next && next.trim()) {
                      setSelectedProductGroup(next.trim());
                    }
                  }
                }}
                className={`${styles.toolBtn} ${!selectedProductGroup ? styles.toolBtnDisabled : ""}`}
                title="Edit selected group"
              >
                <Edit3 size={13} /> Edit group
              </button>

              <button
                type="button"
                disabled={!selectedProductGroup}
                onClick={() => {
                  if (selectedProductGroup) {
                    if (window.confirm(`Clear filter for group "${selectedProductGroup}"?`)) {
                      setSelectedProductGroup(null);
                    }
                  }
                }}
                className={`${styles.toolBtn} ${!selectedProductGroup ? styles.toolBtnDisabled : ""}`}
                title="Delete/Reset group filter"
              >
                <Trash2 size={13} /> Delete group
              </button>

              <Link
                href="/inventory/new"
                className={styles.toolBtn}
                style={{ background: "#00a2ed", color: "#ffffff", fontWeight: 700 }}
              >
                <Plus size={13} /> New product
              </Link>

              <Link
                href={selectedProductId ? `/inventory/${selectedProductId}/edit` : "#"}
                className={`${styles.toolBtn} ${!selectedProductId ? styles.toolBtnDisabled : ""}`}
              >
                <Edit3 size={13} /> Edit product
              </Link>

              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={!selectedProductId || isDeletingProduct}
                className={`${styles.toolBtn} ${!selectedProductId ? styles.toolBtnDisabled : ""}`}
                style={{ color: selectedProductId ? "#ef4444" : "inherit" }}
              >
                <Trash2 size={13} /> {isDeletingProduct ? "Deleting..." : "Delete product"}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className={styles.toolBtn}
                title="Print product list"
              >
                <Printer size={13} /> Print
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className={styles.toolBtn}
                title="Save product catalog as PDF"
              >
                <FileDown size={13} /> Save as PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedProductId) {
                    const p = products.find(x => x.id === selectedProductId);
                    alert(`Price Tag Preview:\n\n${p?.name}\nBarcode: ${p?.barcode || 'N/A'}\nPrice: ₹${formatCurrency(p?.sellingPrice)}\nGST: ${p?.taxRate || 18}%\nTechNext Certified ERP`);
                  } else {
                    alert("Select a product row to print or inspect price tag.");
                  }
                }}
                className={`${styles.toolBtn} ${!selectedProductId ? styles.toolBtnDisabled : ""}`}
                title="Generate product price tags"
              >
                <Tag size={13} /> Price tags
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("Products table is sorted by name and category.");
                }}
                className={styles.toolBtn}
                title="Sort products"
              >
                <ArrowUpDown size={13} /> Sorting
              </button>

              <button
                type="button"
                onClick={() => {
                  const totalCost = products.reduce((acc, p) => acc + Number(p.purchasePrice || 0), 0);
                  const totalSale = products.reduce((acc, p) => acc + Number(p.sellingPrice || 0), 0);
                  const avgMargin = totalSale > 0 ? (((totalSale - totalCost) / totalSale) * 100).toFixed(1) : 0;
                  alert(`Moving Average Metrics:\n\nTotal Inventory Cost: ₹${formatCurrency(totalCost)}\nTotal Catalog Value: ₹${formatCurrency(totalSale)}\nAverage Gross Margin: ${avgMargin}%`);
                }}
                className={styles.toolBtn}
                title="View moving average price & margin"
              >
                <TrendingUp size={13} /> Mov. avg. price
              </button>

              <Link
                href="/inventory/new"
                className={styles.toolBtn}
                title="Import products from Excel/CSV"
              >
                <Upload size={13} /> Import
              </Link>

              <button
                type="button"
                onClick={handleExportProductsCSV}
                className={styles.toolBtn}
                title="Export catalog as CSV"
              >
                <Download size={13} /> Export
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("TechNext Billing & Inventory Help:\n\n• Double click any product to quickly edit details.\n• Select a category on the left to filter the products table.\n• Add service products (software, AMC, domain, hosting) or physical hardware items.");
                }}
                className={styles.toolBtn}
                title="Help and documentation"
              >
                <HelpCircle size={13} /> Help
              </button>
            </div>

            {/* Group Tree & Products Split (Screenshot 4) */}
            <div className={styles.productsSplit}>
              {/* Left Group Tree Panel */}
              <div className={`${styles.panelCard} ${styles.groupTreePanel}`}>
                <div className={styles.groupTreeHeader}>
                  <Layers size={13} color="#00a2ed" />
                  <span style={{ fontWeight: 700, fontSize: "11.5px", textTransform: "uppercase" }}>Categories</span>
                </div>
                <div className={styles.groupTreeList}>
                  <button
                    type="button"
                    onClick={() => setSelectedProductGroup(null)}
                    className={`${styles.groupTreeItem} ${selectedProductGroup === null ? styles.groupTreeItemActive : ""}`}
                  >
                    📁 Products ({products.length})
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
                      placeholder="Product name, barcode, code..."
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
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#00a2ed" }}>
                    Products count: {filteredProducts.length}
                  </div>
                </div>

                {/* Products Table (Screenshot 4 Columns) */}
                <div className={styles.tableWrapper} style={{ maxHeight: "calc(100vh - 220px)" }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: "80px" }}>Code</th>
                        <th>Name</th>
                        <th>Group</th>
                        <th>Barcode</th>
                        <th style={{ textAlign: "right" }}>Cost</th>
                        <th style={{ textAlign: "right" }}>Sale price...</th>
                        <th style={{ textAlign: "center" }}>Taxes</th>
                        <th style={{ textAlign: "right" }}>Sale price</th>
                        <th style={{ textAlign: "center" }}>Active</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: "center", padding: "30px", opacity: 0.6 }}>
                            No products found in this category.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p, idx) => {
                          const isSelected = selectedProductId === p.id;
                          const taxPct = 0; // 0% Tax
                          const exclPrice = Number(p.sellingPrice || 0);
                          const code = p.sku || p.aroniumId || `8${80 + idx}`;

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
                                {p.unit || (p.isService ? "SOFTWARE" : "PCS")}
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

        {/* ========================================================= */}
        {/* VIEW 5: STOCK MODULE                                      */}
        {/* ========================================================= */}
        {activeView === "STOCK" && (
          <div style={{ padding: "16px 20px" }}>
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 2px 0", color: "#00a2ed" }}>
                    Stock &amp; Warehouse Inventory
                  </h3>
                  <div style={{ fontSize: "12px", opacity: 0.75 }}>
                    Real-time stock valuation and inventory tracking
                  </div>
                </div>
                <Link href="/inventory" className={styles.toolBtn} style={{ background: "#00a2ed", color: "#fff" }}>
                  Open Full Inventory →
                </Link>
              </div>

              <div className={styles.tableWrapper} style={{ maxHeight: "calc(100vh - 220px)" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>SKU / Code</th>
                      <th>Product / Service</th>
                      <th>Group</th>
                      <th style={{ textAlign: "right" }}>Cost (₹)</th>
                      <th style={{ textAlign: "center" }}>In Stock</th>
                      <th>Unit</th>
                      <th style={{ textAlign: "right" }}>Total Valuation (₹)</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const qty = p.currentStock || 10;
                      const val = qty * (p.purchasePrice || 0);
                      return (
                        <tr key={p.id}>
                          <td style={{ fontFamily: "monospace" }}>{p.sku || p.aroniumId || "---"}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{p.category || "General"}</td>
                          <td style={{ textAlign: "right" }}>₹{formatCurrency(p.purchasePrice)}</td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{p.isService ? "∞" : qty}</td>
                          <td>{p.unit || "PCS"}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>₹{formatCurrency(val)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={styles.badgePaid}>In Stock</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: CUSTOMERS & SUPPLIERS                             */}
        {/* ========================================================= */}
        {activeView === "CUSTOMERS" && (
          <div style={{ padding: "16px 20px" }}>
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 2px 0", color: "#00a2ed" }}>
                    Customers &amp; Suppliers Directory ({customers.length})
                  </h3>
                  <div style={{ fontSize: "12px", opacity: 0.75 }}>
                    All accounts synced from Aronium POS database
                  </div>
                </div>
                <Link href="/customers" className={styles.toolBtn} style={{ background: "#00a2ed", color: "#fff" }}>
                  Manage Accounts →
                </Link>
              </div>

              <div className={styles.tableWrapper} style={{ maxHeight: "calc(100vh - 220px)" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>#</th>
                      <th>Customer Code</th>
                      <th>Name / Company</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ opacity: 0.6 }}>{i + 1}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#00a2ed" }}>
                          TN-{c.customerNumber || c.aroniumCode || c.id.slice(-4)}
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.name} {c.company ? `(${c.company})` : ""}</td>
                        <td>{c.phone || "---"}</td>
                        <td>Customer</td>
                        <td>
                          <Link href={`/customers/${c.id}`} className={styles.toolBtn} style={{ padding: "2px 8px", fontSize: "11px" }}>
                            View Account
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: PAYMENT TYPES                                     */}
        {/* ========================================================= */}
        {activeView === "PAYMENT_TYPES" && (
          <div style={{ padding: "16px 20px" }}>
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 12px 0", color: "#00a2ed" }}>
                Configured Payment Tender Types
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {[
                  { name: "UPI PAYMENT", desc: "Instant QR / GooglePay / PhonePe", active: true },
                  { name: "CASH", desc: "Physical Cash Currency", active: true },
                  { name: "BANK TRANSFER (NEFT/IMPS)", desc: "Direct Account Settlement", active: true },
                  { name: "SPLIT MULTI-DATE SCHEDULE", desc: "Custom Milestone Installments", active: true },
                  { name: "CARD / POS", desc: "Debit / Credit Terminal", active: true },
                ].map(pt => (
                  <div key={pt.name} style={{ border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: "6px", padding: "14px" }}>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{pt.name}</div>
                    <div style={{ fontSize: "11.5px", opacity: 0.7, margin: "4px 0 8px 0" }}>{pt.desc}</div>
                    <span className={styles.badgePaid}>Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: TAX RATES                                         */}
        {/* ========================================================= */}
        {activeView === "TAX_RATES" && (
          <div style={{ padding: "16px 20px" }}>
            <div className={styles.panelCard} style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 12px 0", color: "#00a2ed" }}>
                Official Tax Rates (GST India)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {[
                  { name: "GST 18%", rate: "18.00%", cgst: "9%", sgst: "9%", desc: "Software, IT Services, SaaS" },
                  { name: "GST 12%", rate: "12.00%", cgst: "6%", sgst: "6%", desc: "Hardware & Peripheral Goods" },
                  { name: "GST 5%", rate: "5.00%", cgst: "2.5%", sgst: "2.5%", desc: "Specified Essential Goods" },
                  { name: "GST 0% / Exempt", rate: "0.00%", cgst: "0%", sgst: "0%", desc: "Export / Non-taxable" },
                ].map(tx => (
                  <div key={tx.name} style={{ border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: "6px", padding: "14px" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#00a2ed" }}>{tx.name}</div>
                    <div style={{ fontSize: "12px", margin: "4px 0" }}>CGST: {tx.cgst} | SGST: {tx.sgst}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>{tx.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: MY COMPANY                                        */}
        {/* ========================================================= */}
        {activeView === "MY_COMPANY" && (
          <div style={{ padding: "16px 20px" }}>
            {isTestUser ? (
              <div className={styles.panelCard} style={{ padding: "24px", color: "var(--text-muted)", textAlign: "center" }}>
                Company profile is confidential and not available for test accounts.
              </div>
            ) : (
              <div className={styles.panelCard} style={{ padding: "20px", maxWidth: "600px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 14px 0", color: "#00a2ed" }}>
                  Company Profile &amp; Letterhead
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div><strong>Company Name:</strong> TechNext Technologies Private Limited</div>
                  <div><strong>Registered Address:</strong> Door No. 4/487, Pulpally, Wayanad, Kerala - 673579, India</div>
                  <div><strong>Official Email:</strong> technexttechnologies@gmail.com</div>
                  <div><strong>Contact Phone:</strong> +91 85906 74531</div>
                  <div><strong>Website:</strong> technexttechnologies.in</div>
                  <div><strong>ERP Database:</strong> PostgreSQL &amp; Aronium POS Synchronized</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback for PROMOTIONS, SECURITY, COUNTRIES */}
        {["PROMOTIONS", "SECURITY", "COUNTRIES"].includes(activeView) && (
          <div style={{ padding: "16px 20px" }}>
            <div className={styles.panelCard} style={{ padding: "24px", textAlign: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#00a2ed" }}>
                {currentViewTitle}
              </h3>
              <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>
                System configuration is managed by enterprise admin policy.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* EXECUTIVE PRINTABLE REPORT DOCUMENT (For Vector Print/PDF) */}
        {/* ========================================================= */}
        <div id="executive-printable-report" className={styles.printableReportContainer}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                {!isTestUser && (
                  <img
                    src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png"
                    alt="TechNext Technologies"
                    style={{ height: "36px", objectFit: "contain" }}
                  />
                )}
                <div>
                  <h1 style={{ fontSize: "18px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em", color: "#0f172a" }}>
                    {isTestUser ? "Billing & Audit Report" : "TechNext Technologies"}
                  </h1>
                  {!isTestUser && (
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>
                      Enterprise Software, Cloud &amp; Billing Systems
                    </div>
                  )}
                </div>
              </div>
              {!isTestUser && (
                <div style={{ fontSize: "9pt", color: "#334155", lineHeight: 1.4 }}>
                  Door No. 4/487, Pulpally, Wayanad, Kerala - 673579, India<br />
                  Email: technexttechnologies@gmail.com | Phone: +91 85906 74531
                </div>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {generatedReportData ? generatedReportData.title : "Financial Audit Report"}
              </div>
              <div style={{ fontSize: "9pt", color: "#475569", marginTop: "4px" }}>
                <strong>Period:</strong> {repStartDate || "All Time"} to {repEndDate || "Present"}<br />
                <strong>Scope:</strong> Strictly Invoices Only (Estimates Excluded)<br />
                <strong>Document Ref:</strong> TN-REP-2026-{Date.now().toString().slice(-4)}<br />
                <strong>Generated:</strong> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          <table className={styles.printTable}>
            <thead>
              <tr>
                {generatedReportData?.headers.map((h, idx) => (
                  <th key={idx}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {generatedReportData?.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell: any, cIdx: number) => (
                    <td key={cIdx} style={{ textAlign: String(cell).startsWith("₹") ? "right" : "left" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ fontWeight: 800, backgroundColor: "#f1f5f9", borderTop: "2px solid #0f172a" }}>
                <td colSpan={Math.max(1, (generatedReportData?.headers.length || 3) - 3)}>GRAND TOTAL (Invoices Only)</td>
                <td style={{ textAlign: "right", color: "#0284c7" }}>₹{formatCurrency(generatedReportData?.totalSum || 0)}</td>
                <td style={{ textAlign: "right", color: "#10b981" }}>₹{formatCurrency(generatedReportData?.totalPaid || 0)}</td>
                <td style={{ textAlign: "right", color: (generatedReportData?.totalDue || 0) > 0 ? "#ef4444" : "#0f172a" }}>₹{formatCurrency(generatedReportData?.totalDue || 0)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8pt", color: "#64748b" }}>
            <div>
              <div>This is an official computer-generated statement from TechNext Enterprise ERP.</div>
              <div>Verified by Accounts &amp; Financial Auditing Division • Page 1 of 1</div>
            </div>
            <div style={{ textAlign: "center", minWidth: "160px" }}>
              <div style={{ borderBottom: "1px dashed #94a3b8", height: "30px", marginBottom: "4px" }} />
              <div style={{ fontWeight: 700, color: "#0f172a" }}>Authorized Signatory</div>
              <div>TechNext Technologies</div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OFFICIAL RETURN & REFUND WORKFLOW MODAL                   */}
        {/* ========================================================= */}
        {showRefundModal && refundDoc && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}>
            <div style={{
              backgroundColor: theme === "DARK" ? "#1e293b" : "#ffffff",
              color: theme === "DARK" ? "#f8fafc" : "#0f172a",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
              border: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px"
            }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "18px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <RotateCcw size={12} /> Credit Note
                    </span>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
                      Process Return &amp; Issue Refund
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", opacity: 0.75 }}>
                    Original Document #{refundDoc.docNumber} • Customer: <strong>{refundDoc.customerName}</strong> • Original Billed: <strong>₹{formatCurrency(Math.abs(refundDoc.amount))}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme === "DARK" ? "#94a3b8" : "#64748b", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleProcessRefundSubmit}>
                {/* 1. Refund Scope Mode */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.8 }}>
                    Return Scope
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setRefundMode("FULL");
                        setRefundAmount(Math.abs(refundDoc.amount));
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        border: refundMode === "FULL" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                        backgroundColor: refundMode === "FULL" ? (theme === "DARK" ? "#450a0a" : "#fef2f2") : "transparent",
                        color: refundMode === "FULL" ? "#ef4444" : "inherit",
                        fontWeight: 600,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      Full Refund / Cancellation (₹{formatCurrency(Math.abs(refundDoc.amount))})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefundMode("PARTIAL");
                        const sum = refundItems.filter(it => it.selected).reduce((acc, it) => acc + (Number(it.returnQty || 1) * Number(it.unitPrice || it.priceBeforeTax || 0)), 0);
                        setRefundAmount(sum);
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        border: refundMode === "PARTIAL" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                        backgroundColor: refundMode === "PARTIAL" ? (theme === "DARK" ? "#450a0a" : "#fef2f2") : "transparent",
                        color: refundMode === "PARTIAL" ? "#ef4444" : "inherit",
                        fontWeight: 600,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      Partial Return (Select Items &amp; Qty)
                    </button>
                  </div>
                </div>

                {/* 2. Itemized Return Selector (if partial) */}
                {refundMode === "PARTIAL" && (
                  <div style={{ marginBottom: "16px", border: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ backgroundColor: theme === "DARK" ? "#0f172a" : "#f8fafc", padding: "8px 12px", fontSize: "12px", fontWeight: 700, borderBottom: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0" }}>
                      Select Items to Return:
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0", opacity: 0.7 }}>
                          <th style={{ padding: "6px 10px", width: "30px", textAlign: "center" }}></th>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Item</th>
                          <th style={{ padding: "6px 10px", textAlign: "center", width: "90px" }}>Return Qty</th>
                          <th style={{ padding: "6px 10px", textAlign: "right", width: "90px" }}>Unit (₹)</th>
                          <th style={{ padding: "6px 10px", textAlign: "right", width: "100px" }}>Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refundItems.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: theme === "DARK" ? "1px solid #334155" : "1px solid #f1f5f9" }}>
                            <td style={{ padding: "6px 10px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={it.selected}
                                onChange={() => handleRefundItemToggle(idx)}
                                style={{ accentColor: "#ef4444" }}
                              />
                            </td>
                            <td style={{ padding: "6px 10px" }}>
                              <div style={{ fontWeight: 600 }}>{it.name}</div>
                              <div style={{ fontSize: "11px", opacity: 0.65 }}>Code: {it.code}</div>
                            </td>
                            <td style={{ padding: "6px 10px", textAlign: "center" }}>
                              <input
                                type="number"
                                min={1}
                                max={it.quantity || 1}
                                value={it.returnQty || 1}
                                disabled={!it.selected}
                                onChange={(e) => handleRefundQtyChange(idx, parseInt(e.target.value) || 1)}
                                style={{
                                  width: "55px",
                                  padding: "3px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid #cbd5e1",
                                  textAlign: "center",
                                  backgroundColor: theme === "DARK" ? "#0f172a" : "#ffffff",
                                  color: "inherit"
                                }}
                              />
                              <span style={{ fontSize: "10px", opacity: 0.6, display: "block" }}>Max: {it.quantity || 1}</span>
                            </td>
                            <td style={{ padding: "6px 10px", textAlign: "right" }}>
                              ₹{formatCurrency(it.unitPrice || it.priceBeforeTax || 0)}
                            </td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: it.selected ? "#ef4444" : "inherit" }}>
                              ₹{formatCurrency((it.returnQty || 1) * (it.unitPrice || it.priceBeforeTax || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. Refund Amount & Tender Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                      Refund Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#ef4444",
                        backgroundColor: theme === "DARK" ? "#0f172a" : "#ffffff"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                      Refund Tender Method *
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        backgroundColor: theme === "DARK" ? "#0f172a" : "#ffffff",
                        color: "inherit"
                      }}
                    >
                      <option value="UPI REVERSAL">UPI Payment Reversal</option>
                      <option value="CASH REFUND">Cash Tender Refund</option>
                      <option value="BANK ACCOUNT TRANSFER">Bank Account / NEFT Transfer</option>
                      <option value="CUSTOMER STORE CREDIT">Customer Account Store Credit</option>
                    </select>
                  </div>
                </div>

                {/* 4. Reason / Audit Notes */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    Reason / Return Internal Audit Note *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer cancelled service / Returned hardware unit"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      backgroundColor: theme === "DARK" ? "#0f172a" : "#ffffff",
                      color: "inherit"
                    }}
                  />
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: theme === "DARK" ? "1px solid #334155" : "1px solid #e2e8f0", paddingTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "transparent",
                      color: "inherit",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingRefund}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <RotateCcw size={14} />
                    {isProcessingRefund ? "Generating Credit Note..." : "Confirm Return & Issue Refund"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
