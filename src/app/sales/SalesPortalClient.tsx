"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  TrendingUp, FileSignature, Receipt, Briefcase, 
  Settings as SettingsIcon, Plus, Search, Filter, 
  CheckCircle2, Clock, AlertCircle, X, ExternalLink,
  Building, User, IndianRupee, Calendar, ArrowRight,
  ShieldCheck, RefreshCw, Send, Layers, HelpCircle,
  Lock, KeyRound, Shield, Check, UserCheck, MessageSquare, Bell
} from "lucide-react";
import styles from "./sales.module.css";
import { 
  requestQuotation, 
  requestInvoice, 
  requestProject, 
  requestService, 
  quickCreateCustomer,
  requestClientAccess,
  reviewClientAccess
} from "./actions";
import { getWhatsAppLink, buildPaymentReminderMessage } from "@/lib/whatsapp";

interface SalesPortalProps {
  currentUser: any;
  customers: any[];
  accessRequests: any[];
  quotationRequests: any[];
  invoiceRequests: any[];
  projects: any[];
  services: any[];
  isAdmin: boolean;
  initialTab?: "overview" | "quotations" | "invoices" | "projects" | "services" | "clients" | "access-requests";
}

export default function SalesPortalClient({
  currentUser,
  customers,
  accessRequests,
  quotationRequests,
  invoiceRequests,
  projects,
  services,
  isAdmin,
  initialTab = "overview",
}: SalesPortalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quotations" | "invoices" | "projects" | "services" | "clients" | "access-requests">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [clientSubTab, setClientSubTab] = useState<"my-clients" | "other-clients">("my-clients");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Client Access Modals
  const [requestingAccessCustomer, setRequestingAccessCustomer] = useState<any | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [reassignClient, setReassignClient] = useState(false);

  // Pre-selected customer for quick actions from Clients tab
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Invoice calculations (0% Tax)
  const [invSubtotal, setInvSubtotal] = useState<number>(0);
  const [invGst, setInvGst] = useState<number>(0);

  // Status & error messages
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics
  const totalQuotes = quotationRequests.length;
  const pendingQuotes = quotationRequests.filter(q => ["SUBMITTED", "UNDER_REVIEW", "DRAFT"].includes(q.status)).length;
  
  const totalInvoices = invoiceRequests.length;
  const totalInvoiceValue = invoiceRequests.reduce((sum, inv) => sum + (inv.amountRequested || 0), 0);
  
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => !["COMPLETED", "ON_HOLD"].includes(p.status)).length;
  
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === "ACTIVE").length;

  const pendingAccessRequestsCount = accessRequests.filter(r => r.status === "PENDING").length;

  // Separate clients into My Approved Clients vs Other Company Clients
  const myClients = customers.filter(c => c.hasAccess);
  const otherClients = customers.filter(c => !c.hasAccess);

  const closeAllModals = () => {
    setIsQuoteModalOpen(false);
    setIsInvoiceModalOpen(false);
    setIsProjectModalOpen(false);
    setIsServiceModalOpen(false);
    setIsCustomerModalOpen(false);
    setRequestingAccessCustomer(null);
    setReviewingRequest(null);
    setSelectedCustomerId("");
    setFormError(null);
    setFormSuccess(null);
  };

  // 1. Submit Quotation Handler
  const handleQuoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await requestQuotation(formData);
        setFormSuccess("Quotation request submitted to admin successfully!");
        setTimeout(() => closeAllModals(), 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to submit quotation request");
      }
    });
  };

  // 2. Submit Invoice Handler
  const handleInvoiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await requestInvoice(formData);
        setFormSuccess("Invoice request submitted successfully!");
        setTimeout(() => closeAllModals(), 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to submit invoice request");
      }
    });
  };

  // 3. Submit Project Handler
  const handleProjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await requestProject(formData);
        setFormSuccess("Project handover created and registered!");
        setTimeout(() => closeAllModals(), 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to create project request");
      }
    });
  };

  // 4. Submit Service Package Handler
  const handleServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await requestService(formData);
        setFormSuccess("Service subscription provisioned successfully!");
        setTimeout(() => closeAllModals(), 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to request service package");
      }
    });
  };

  // 5. Submit Customer Handler
  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await quickCreateCustomer(formData);
        setFormSuccess(res.existing ? "Customer matched and updated!" : "New customer profile created!");
        if (res.customer?.id) {
          setSelectedCustomerId(res.customer.id);
        }
        setTimeout(() => setIsCustomerModalOpen(false), 1000);
      } catch (err: any) {
        setFormError(err.message || "Failed to create customer");
      }
    });
  };

  // 6. Submit Access Request Handler
  const handleAccessRequestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await requestClientAccess(formData);
        setFormSuccess("Access request submitted to Admin successfully!");
        setTimeout(() => closeAllModals(), 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to request access");
      }
    });
  };

  // 7. Admin Review Access Request
  const handleReviewAccess = (status: "APPROVED" | "REJECTED") => {
    if (!reviewingRequest) return;
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      try {
        await reviewClientAccess(reviewingRequest.id, status, adminRemarks, reassignClient);
        setFormSuccess(`Access request ${status.toLowerCase()} successfully!`);
        setTimeout(() => closeAllModals(), 1000);
      } catch (err: any) {
        setFormError(err.message || "Failed to review request");
      }
    });
  };

  // Filtered lists
  const filteredQuotes = quotationRequests.filter(q => {
    const matchesSearch = 
      q.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customer?.company && q.customer.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoiceRequests.filter(inv => {
    const matchesSearch = 
      inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.project?.name && inv.project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.customer?.name && p.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.type && p.type.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredServices = services.filter(s => {
    const matchesSearch = 
      s.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.packageType && s.packageType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayedClients = (clientSubTab === "my-clients" ? myClients : otherClients).filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <img 
            src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
            alt="TechNext Technologies" 
            className={styles.heroLogo} 
          />
          <div className={styles.heroInfo}>
            <h1>
              Sales Operations Hub
              <span className={styles.repBadge}>
                <ShieldCheck size={14} /> {currentUser.role === "SALES" ? "Sales Executive" : currentUser.role}
              </span>
            </h1>
            <p>
              Welcome back, <strong>{currentUser.name}</strong> ({currentUser.employeeId || "Sales Staff"}). 
              {currentUser.role === "SALES" 
                ? " You have access to your assigned clients and approved deal pipelines."
                : " Super Admin Console — Full company-wide pipeline visibility and client access approval control."
              }
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className="btn-secondary"
          onClick={() => setIsCustomerModalOpen(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
        >
          <User size={16} /> + Quick Client
        </button>
      </section>

      {/* Quick Action Bar (4 Big Request CTAs) */}
      <section className={styles.quickActionsGrid}>
        {/* 1. Request Quotation */}
        <div 
          className={styles.actionButton}
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setIsQuoteModalOpen(true);
          }}
          style={{ "--action-accent": "#635bff" } as React.CSSProperties}
        >
          <div className={styles.actionTop}>
            <div className={styles.actionIcon} style={{ background: "rgba(99, 91, 255, 0.1)", color: "#635bff" }}>
              <FileSignature size={22} />
            </div>
            <div className={styles.actionPlusBadge}>+</div>
          </div>
          <div>
            <h3 className={styles.actionTitle}>Request Quotation</h3>
            <p className={styles.actionDesc}>Submit proposal specs for your clients to admin for pricing & PDF generation.</p>
          </div>
        </div>

        {/* 2. Request Invoice */}
        <div 
          className={styles.actionButton}
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setInvSubtotal(0);
            setIsInvoiceModalOpen(true);
          }}
          style={{ "--action-accent": "#10b981" } as React.CSSProperties}
        >
          <div className={styles.actionTop}>
            <div className={styles.actionIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              <Receipt size={22} />
            </div>
            <div className={styles.actionPlusBadge} style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}>+</div>
          </div>
          <div>
            <h3 className={styles.actionTitle}>Request Invoice</h3>
            <p className={styles.actionDesc}>Bill client for upfront advance, project milestone, or final settlement.</p>
          </div>
        </div>

        {/* 3. Request / Handover Project */}
        <div 
          className={styles.actionButton}
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setIsProjectModalOpen(true);
          }}
          style={{ "--action-accent": "#3b82f6" } as React.CSSProperties}
        >
          <div className={styles.actionTop}>
            <div className={styles.actionIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
              <Briefcase size={22} />
            </div>
            <div className={styles.actionPlusBadge} style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)" }}>+</div>
          </div>
          <div>
            <h3 className={styles.actionTitle}>Handover Project</h3>
            <p className={styles.actionDesc}>Initiate won deal, define requirements scope, target deadline, and assign to technical leads.</p>
          </div>
        </div>

        {/* 4. Request Service / Package */}
        <div 
          className={styles.actionButton}
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setIsServiceModalOpen(true);
          }}
          style={{ "--action-accent": "#f59e0b" } as React.CSSProperties}
        >
          <div className={styles.actionTop}>
            <div className={styles.actionIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
              <RefreshCw size={22} />
            </div>
            <div className={styles.actionPlusBadge} style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" }}>+</div>
          </div>
          <div>
            <h3 className={styles.actionTitle}>Provision Service</h3>
            <p className={styles.actionDesc}>Book ongoing website AMC, domain & cloud hosting, SEO maintenance, or custom SLA package.</p>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: "rgba(99, 91, 255, 0.1)", color: "#635bff" }}>
            <FileSignature size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalQuotes}</span>
            <span className={styles.statLabel}>Quotes Requested ({pendingQuotes} pending)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <IndianRupee size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>₹{totalInvoiceValue.toLocaleString("en-IN")}</span>
            <span className={styles.statLabel}>{totalInvoices} Invoices Requested</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
            <Briefcase size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{activeProjects}</span>
            <span className={styles.statLabel}>Active Won Projects ({totalProjects} total)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <UserCheck size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{myClients.length}</span>
            <span className={styles.statLabel}>My Approved Clients ({otherClients.length} locked)</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("overview"); setStatusFilter("ALL"); }}
          >
            <TrendingUp size={16} /> Pipeline Overview
          </button>

          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "quotations" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("quotations"); setStatusFilter("ALL"); }}
          >
            <FileSignature size={16} /> Quotation Requests
            <span className={styles.tabBadge}>{totalQuotes}</span>
          </button>

          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "invoices" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("invoices"); setStatusFilter("ALL"); }}
          >
            <Receipt size={16} /> Invoice Requests
            <span className={styles.tabBadge}>{totalInvoices}</span>
          </button>

          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "projects" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("projects"); setStatusFilter("ALL"); }}
          >
            <Briefcase size={16} /> Won Projects
            <span className={styles.tabBadge}>{totalProjects}</span>
          </button>

          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "services" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("services"); setStatusFilter("ALL"); }}
          >
            <RefreshCw size={16} /> Sold Services
            <span className={styles.tabBadge}>{totalServices}</span>
          </button>

          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "clients" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("clients"); setStatusFilter("ALL"); }}
          >
            <User size={16} /> Client Directory
            <span className={styles.tabBadge}>{myClients.length}</span>
          </button>

          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === "access-requests" ? styles.tabBtnActive : ""}`}
            onClick={() => { setActiveTab("access-requests"); setStatusFilter("ALL"); }}
          >
            <Shield size={16} /> Client Access Approvals
            {pendingAccessRequestsCount > 0 && (
              <span className={styles.tabBadge} style={{ background: "#fef3c7", color: "#b45309" }}>
                {pendingAccessRequestsCount} pending
              </span>
            )}
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by customer, deal, project..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab !== "overview" && activeTab !== "clients" && activeTab !== "access-requests" && (
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {activeTab === "quotations" && (
                <>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="QUOTATION_GENERATED">Quotation Generated</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </>
              )}
              {activeTab === "invoices" && (
                <>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="INVOICE_GENERATED">Invoice Generated</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
              {activeTab === "projects" && (
                <>
                  <option value="PROJECT_RECEIVED">Project Received</option>
                  <option value="REQUIREMENT_ANALYSIS">Requirement Analysis</option>
                  <option value="DEVELOPMENT">Development</option>
                  <option value="COMPLETED">Completed</option>
                </>
              )}
              {activeTab === "services" && (
                <>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
            </select>
          )}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Recent Quotation Requests */}
          <div className={styles.contentCard}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileSignature size={18} color="#635bff" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Recent Quotation Requests</h3>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setActiveTab("quotations")} style={{ fontSize: "12px", padding: "4px 10px" }}>
                View All Quotes <ArrowRight size={14} style={{ display: "inline" }} />
              </button>
            </div>
            
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service Requested</th>
                    <th>Budget</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Requested On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationRequests.slice(0, 5).map((q) => (
                    <tr key={q.id}>
                      <td>
                        <strong>{q.customer?.name}</strong>
                        {q.customer?.company && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{q.customer.company}</div>}
                      </td>
                      <td>{q.serviceName}</td>
                      <td>{q.budget || "—"}</td>
                      <td>
                        <span className={`${styles.statusPill} ${q.priority === "URGENT" || q.priority === "HIGH" ? styles.statusRejected : styles.statusPending}`}>
                          {q.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${q.status === "QUOTATION_GENERATED" || q.status === "ACCEPTED" ? styles.statusApproved : styles.statusPending}`}>
                          {q.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link href={`/quotation-requests/${q.id}`} className="btn-secondary" style={{ fontSize: "11px", padding: "4px 8px" }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {quotationRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No quotation requests yet. Click "Request Quotation" above to initiate your first quote.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Invoices & Won Projects Side-by-Side */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px" }}>
            {/* Recent Invoices */}
            <div className={styles.contentCard}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Receipt size={18} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Recent Invoice Requests</h3>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("invoices")} style={{ fontSize: "12px", padding: "4px 10px" }}>
                  All Invoices <ArrowRight size={14} style={{ display: "inline" }} />
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRequests.slice(0, 5).map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <strong>{inv.customer?.name}</strong>
                          {inv.project && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{inv.project.name}</div>}
                        </td>
                        <td>
                          <strong>₹{inv.amountRequested.toLocaleString("en-IN")}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Subtotal: ₹{inv.subtotal}</div>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${inv.status === "PAID" || inv.status === "INVOICE_GENERATED" ? styles.statusApproved : styles.statusPending}`}>
                            {inv.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {invoiceRequests.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                          No invoice requests yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Won Projects Pipeline */}
            <div className={styles.contentCard}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Briefcase size={18} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Won Projects Delivery</h3>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("projects")} style={{ fontSize: "12px", padding: "4px 10px" }}>
                  All Projects <ArrowRight size={14} style={{ display: "inline" }} />
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Client</th>
                      <th>Progress</th>
                      <th>Target Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.type || "Software"}</div>
                        </td>
                        <td>{p.customer?.name}</td>
                        <td>
                          <div className={styles.progressTrack}>
                            <div className={styles.progressBar} style={{ width: `${p.progress || 0}%` }} />
                          </div>
                          <span>{p.progress || 0}%</span>
                        </td>
                        <td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                          No projects initiated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUOTATIONS TAB */}
      {activeTab === "quotations" && (
        <div className={styles.contentCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Customer</th>
                  <th>Service / Product</th>
                  <th>Budget</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Admin Notes / Ref #</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => (
                  <tr key={q.id}>
                    <td><code>{q.id.slice(-6).toUpperCase()}</code></td>
                    <td>
                      <strong>{q.customer?.name}</strong>
                      {q.customer?.company && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{q.customer.company}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{q.serviceName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.requirementDetails}
                      </div>
                    </td>
                    <td>{q.budget || "Flexible"}</td>
                    <td>
                      <span className={`${styles.statusPill} ${q.priority === "URGENT" || q.priority === "HIGH" ? styles.statusRejected : styles.statusPending}`}>
                        {q.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${q.status === "QUOTATION_GENERATED" || q.status === "ACCEPTED" ? styles.statusApproved : styles.statusPending}`}>
                        {q.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {q.aroniumQuotationNo ? (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-primary)" }}>#{q.aroniumQuotationNo}</span>
                      ) : q.adminNotes ? (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{q.adminNotes}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Under review</span>
                      )}
                    </td>
                    <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link href={`/quotation-requests/${q.id}`} className="btn-secondary" style={{ fontSize: "11px", padding: "4px 8px" }}>
                          Details
                        </Link>
                        {q.pdfUrl && (
                          <a href={q.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: "11px", padding: "4px 8px" }}>
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className={styles.emptyState}>
                        <FileSignature size={36} color="var(--brand-primary)" />
                        <h3>No Quotation Requests Found</h3>
                        <p>No quotation requests match your current filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INVOICES TAB */}
      {activeTab === "invoices" && (
        <div className={styles.contentCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Customer</th>
                  <th>Project</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total Amount</th>
                  <th>Reminder</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Official Invoice #</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><code>{inv.id.slice(-6).toUpperCase()}</code></td>
                    <td>
                      <strong>{inv.customer?.name}</strong>
                      {inv.customer?.company && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{inv.customer.company}</div>}
                    </td>
                    <td>{inv.project?.name || "—"}</td>
                    <td>₹{inv.subtotal.toLocaleString("en-IN")}</td>
                    <td><span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>0% Tax</span></td>
                    <td>
                      <strong style={{ color: "#10b981", fontSize: "14px" }}>
                        ₹{inv.amountRequested.toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      {inv.customer?.phone && inv.status !== "PAID" && inv.status !== "CANCELLED" ? (
                        <a
                          href={getWhatsAppLink(
                            inv.customer.phone,
                            buildPaymentReminderMessage({
                              customerName: inv.customer.name,
                              invoiceNumber: inv.aroniumInvoiceNo || inv.id.slice(-6).toUpperCase(),
                              totalAmount: inv.amountRequested,
                              pendingAmount: inv.amountRequested,
                              viewUrl: inv.customer?.portalToken 
                                ? `https://technextmanage.vercel.app/portal/${inv.customer.portalToken}/invoices/${inv.id}` 
                                : `https://technextmanage.vercel.app/request/invoice/${inv.id}`
                            })
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ fontSize: "11px", padding: "4px 8px", background: "#fef3c7", color: "#b45309", borderColor: "#fde68a", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                          title="Send 1-Click WhatsApp Payment Reminder"
                        >
                          <Bell size={11} /> Remind
                        </a>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.notes || "—"}
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${inv.status === "PAID" || inv.status === "INVOICE_GENERATED" ? styles.statusApproved : styles.statusPending}`}>
                        {inv.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {inv.aroniumInvoiceNo ? (
                        <span style={{ fontWeight: 700, color: "var(--brand-primary)" }}>#{inv.aroniumInvoiceNo}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Pending</span>
                      )}
                    </td>
                    <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className={styles.emptyState}>
                        <Receipt size={36} color="#10b981" />
                        <h3>No Invoice Requests Found</h3>
                        <p>Click "Request Invoice" to bill your clients.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PROJECTS TAB */}
      {activeTab === "projects" && (
        <div className={styles.contentCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Category</th>
                  <th>Deal Value</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Start Date</th>
                  <th>Target Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {p.description && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{p.customer?.name}</strong>
                      {p.customer?.phone && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.customer.phone}</div>}
                    </td>
                    <td>{p.type || "Software"}</td>
                    <td>
                      {p.estimatedBudget ? (
                        <strong>₹{p.estimatedBudget.toLocaleString("en-IN")}</strong>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${p.status === "COMPLETED" ? styles.statusApproved : styles.statusProgress}`}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressBar} style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>{p.progress || 0}%</span>
                    </td>
                    <td>{new Date(p.startDate).toLocaleDateString()}</td>
                    <td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}</td>
                    <td>
                      <Link href={`/track/${p.id}`} target="_blank" className="btn-secondary" style={{ fontSize: "11px", padding: "4px 8px" }}>
                        Track <ExternalLink size={12} style={{ display: "inline" }} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className={styles.emptyState}>
                        <Briefcase size={36} color="#3b82f6" />
                        <h3>No Projects Found</h3>
                        <p>Click "Handover Project" above to submit a new deal to engineering.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SERVICES TAB */}
      {activeTab === "services" && (
        <div className={styles.contentCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Client</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Contract Term</th>
                  <th>Start Date</th>
                  <th>Renewal Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.packageName}</strong>
                      {s.notes && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{s.customer?.name}</strong>
                      {s.customer?.company && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.customer.company}</div>}
                    </td>
                    <td>
                      <span className={styles.statusPill} style={{ background: "rgba(99, 91, 255, 0.08)", color: "#635bff" }}>
                        {s.packageType}
                      </span>
                    </td>
                    <td>
                      <strong>₹{s.packagePrice.toLocaleString("en-IN")}</strong>
                    </td>
                    <td>{s.isLifetime ? "Lifetime" : `${s.contractPeriod} Months`}</td>
                    <td>{new Date(s.purchaseDate).toLocaleDateString()}</td>
                    <td>
                      {s.isLifetime ? (
                        <span style={{ color: "#10b981", fontWeight: 600 }}>Lifetime Active</span>
                      ) : s.renewalDate ? (
                        new Date(s.renewalDate).toLocaleDateString()
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${s.status === "ACTIVE" ? styles.statusApproved : styles.statusRejected}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className={styles.emptyState}>
                        <RefreshCw size={36} color="#f59e0b" />
                        <h3>No Services Found</h3>
                        <p>Click "Provision Service" to book AMC, cloud, or maintenance contracts.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CLIENT DIRECTORY & PERMISSION VIEW */}
      {activeTab === "clients" && (
        <div className={styles.contentCard}>
          {/* Sub-Tabs: My Approved Clients vs Other Company Clients */}
          <div className={styles.subTabsBar}>
            <button 
              type="button" 
              className={`${styles.subTabBtn} ${clientSubTab === "my-clients" ? styles.subTabBtnActive : ""}`}
              onClick={() => setClientSubTab("my-clients")}
            >
              <UserCheck size={15} /> My Approved Clients ({myClients.length})
            </button>

            <button 
              type="button" 
              className={`${styles.subTabBtn} ${clientSubTab === "other-clients" ? styles.subTabBtnActive : ""}`}
              onClick={() => setClientSubTab("other-clients")}
            >
              <Lock size={14} /> Other Company Clients ({otherClients.length})
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Assigned Rep</th>
                  <th>Access / Deal Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedClients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      {!c.hasAccess && (
                        <span className={styles.lockedPill} style={{ marginLeft: "8px" }}>
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </td>
                    <td>{c.company || "—"}</td>
                    <td>
                      {c.hasAccess ? (
                        <span>{c.phone}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{c.phone}</span>
                      )}
                    </td>
                    <td>
                      {c.hasAccess ? (
                        <span>{c.email || "—"}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{c.email}</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.assignedToName}</span>
                    </td>
                    <td>
                      {c.hasAccess ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsQuoteModalOpen(true);
                            }}
                          >
                            + Quote
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsInvoiceModalOpen(true);
                            }}
                          >
                            + Invoice
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsProjectModalOpen(true);
                            }}
                          >
                            + Project
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsServiceModalOpen(true);
                            }}
                          >
                            + Service
                          </button>
                          {c.phone && (
                            <a
                              href={getWhatsAppLink(c.phone, `Hello ${c.name} 👋, here is your secure client portal link from Technext Technologies:\nhttps://technextmanage.vercel.app/portal/${c.portalToken || ''}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary"
                              style={{ fontSize: "11px", padding: "4px 8px", background: "#25D366", color: "#FFFFFF", borderColor: "#25D366", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                              title="Send Client Portal link via WhatsApp"
                            >
                              <MessageSquare size={11} /> Portal
                            </a>
                          )}
                        </div>
                      ) : (
                        <div>
                          {c.accessStatus === "PENDING" ? (
                            <span className={styles.statusPill} style={{ background: "#fef3c7", color: "#b45309" }}>
                              <Clock size={12} /> Pending Admin Review
                            </span>
                          ) : c.accessStatus === "REJECTED" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className={styles.statusPill} style={{ background: "#fee2e2", color: "#b91c1c" }} title={c.adminRemarks || "Denied by Admin"}>
                                ❌ Denied
                              </span>
                              <button 
                                type="button" 
                                className={styles.requestAccessBtn} 
                                style={{ fontSize: "11px", padding: "2px 6px" }}
                                onClick={() => setRequestingAccessCustomer(c)}
                              >
                                Re-Apply
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              className={styles.requestAccessBtn}
                              onClick={() => setRequestingAccessCustomer(c)}
                            >
                              <Lock size={12} /> Request Admin Approval
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {displayedClients.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.emptyState}>
                        <User size={36} color="var(--brand-primary)" />
                        <h3>No Clients Found</h3>
                        <p>
                          {clientSubTab === "my-clients" 
                            ? "You don't have any assigned clients matching this search. Check 'Other Company Clients' to request access."
                            : "No other clients match your search filter."
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CLIENT ACCESS APPROVALS TAB */}
      {activeTab === "access-requests" && (
        <div className={styles.contentCard}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>Client Access Requests & Approvals</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                {isAdmin 
                  ? "Review and approve/reject sales staff requests to access protected client data."
                  : "Track the status of your client access requests submitted to management."
                }
              </p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Requested Client</th>
                  <th>Sales Representative</th>
                  <th>Reason / Scope of Work</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                  <th>Submitted Date</th>
                  {isAdmin && <th>Admin Action</th>}
                </tr>
              </thead>
              <tbody>
                {accessRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.customer?.name}</strong>
                      {req.customer?.company && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{req.customer.company}</div>
                      )}
                    </td>
                    <td>
                      <strong>{req.requestedBy?.name}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{req.requestedBy?.employeeId || req.requestedBy?.email}</div>
                    </td>
                    <td style={{ maxWidth: "260px" }}>
                      <div style={{ fontSize: "12.5px", lineHeight: "1.4" }}>{req.reason}</div>
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${
                        req.status === "APPROVED" 
                          ? styles.statusApproved 
                          : req.status === "REJECTED" 
                            ? styles.statusRejected 
                            : styles.statusPending
                      }`}>
                        {req.status === "APPROVED" && <CheckCircle2 size={12} />}
                        {req.status === "PENDING" && <Clock size={12} />}
                        {req.status === "REJECTED" && <AlertCircle size={12} />}
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {req.adminRemarks || (req.status === "PENDING" ? "Awaiting review" : "—")}
                      </span>
                    </td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        {req.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button 
                              type="button" 
                              className="btn-primary" 
                              style={{ fontSize: "11px", padding: "4px 8px", background: "#10b981", borderColor: "#10b981" }}
                              onClick={() => {
                                setReviewingRequest(req);
                                setAdminRemarks("Approved for client deal pitch.");
                              }}
                            >
                              Review & Decide
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            Reviewed by {req.reviewedBy?.name || "Admin"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}

                {accessRequests.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6}>
                      <div className={styles.emptyState}>
                        <Shield size={36} color="var(--brand-primary)" />
                        <h3>No Access Requests</h3>
                        <p>There are no client profile access requests currently recorded.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* MODAL: REQUEST CLIENT ACCESS (FOR SALES REP) */}
      {requestingAccessCustomer && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Lock size={20} color="var(--brand-primary)" />
                Request Admin Approval for Client Access
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAccessRequestSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorBanner}>{formError}</div>}
                {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

                <input type="hidden" name="customerId" value={requestingAccessCustomer.id} />

                <div style={{ background: "rgba(99, 91, 255, 0.06)", border: "1px solid rgba(99, 91, 255, 0.15)", padding: "14px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Client to Access:</div>
                  <strong style={{ fontSize: "16px", color: "var(--text-main)" }}>
                    {requestingAccessCustomer.name} {requestingAccessCustomer.company ? `(${requestingAccessCustomer.company})` : ""}
                  </strong>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Currently Assigned To: <strong>{requestingAccessCustomer.assignedToName}</strong>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="accessReason">Reason for Requesting Client Access *</label>
                  <textarea 
                    id="accessReason" 
                    name="reason" 
                    required 
                    rows={4}
                    placeholder="Explain why you need access (e.g. Client called our sales desk requesting a quotation for software development / AMC renewal)..."
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    This request will be sent directly to the Super Admin for review and approval.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Submitting..." : "Send Request to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN REVIEW ACCESS REQUEST */}
      {reviewingRequest && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Shield size={20} color="var(--brand-primary)" />
                Admin Client Access Decision
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {formError && <div className={styles.errorBanner}>{formError}</div>}
              {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

              <div style={{ background: "rgba(0, 0, 0, 0.02)", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div><strong>Sales Representative:</strong> {reviewingRequest.requestedBy?.name} ({reviewingRequest.requestedBy?.employeeId || reviewingRequest.requestedBy?.email})</div>
                <div><strong>Client Profile:</strong> {reviewingRequest.customer?.name} {reviewingRequest.customer?.company ? `(${reviewingRequest.customer.company})` : ""}</div>
                <div><strong>Reason Stated:</strong> <span style={{ fontStyle: "italic" }}>"{reviewingRequest.reason}"</span></div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="adminRemarks">Admin Remarks / Conditions</label>
                <input 
                  type="text" 
                  id="adminRemarks" 
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Approved for quotation and agreement." 
                />
              </div>

              <div className={styles.fieldGroup}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                  <input 
                    type="checkbox" 
                    checked={reassignClient}
                    onChange={(e) => setReassignClient(e.target.checked)}
                  />
                  Permanently reassign this client's ownership to {reviewingRequest.requestedBy?.name}
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => handleReviewAccess("REJECTED")}
                disabled={isPending}
                style={{ color: "#b91c1c" }}
              >
                Deny Request
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => handleReviewAccess("APPROVED")}
                disabled={isPending}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                {isPending ? "Processing..." : "Approve Client Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. REQUEST QUOTATION MODAL */}
      {isQuoteModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FileSignature size={20} color="#635bff" />
                New Quotation Request
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorBanner}>{formError}</div>}
                {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

                <div className={styles.fieldGroup}>
                  <label htmlFor="quoteCustomer">Select Client (My Approved Clients Only) *</label>
                  <select 
                    id="quoteCustomer" 
                    name="customerId" 
                    required 
                    defaultValue={selectedCustomerId || ""}
                  >
                    <option value="">-- Choose an Approved Client --</option>
                    {myClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""} - {c.phone}
                      </option>
                    ))}
                  </select>
                  {myClients.length === 0 && (
                    <span style={{ fontSize: "11px", color: "#b91c1c" }}>
                      You don't have any approved clients yet. Please onboard a new client or request access in the Client Directory.
                    </span>
                  )}
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="serviceName">Service / Deliverable *</label>
                    <input 
                      type="text" 
                      id="serviceName" 
                      name="serviceName" 
                      required 
                      placeholder="e.g. E-Commerce Website & Mobile App" 
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="budget">Client Budget (Approx.)</label>
                    <input 
                      type="text" 
                      id="budget" 
                      name="budget" 
                      placeholder="e.g. ₹75,000" 
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="priority">Proposal Priority</label>
                  <select id="priority" name="priority" defaultValue="MEDIUM">
                    <option value="LOW">Low (Within 48h)</option>
                    <option value="MEDIUM">Standard (Within 24h)</option>
                    <option value="HIGH">High (Within 6h)</option>
                    <option value="URGENT">Urgent (Immediate Client Pitch)</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="requirementDetails">Requirement Scope & Details *</label>
                  <textarea 
                    id="requirementDetails" 
                    name="requirementDetails" 
                    required 
                    rows={4}
                    placeholder="Describe client requirements, key features, reference sites, deadlines, tech expectations..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending || myClients.length === 0}>
                  {isPending ? "Submitting..." : "Submit Quotation Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REQUEST INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Receipt size={20} color="#10b981" />
                New Invoice Request
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorBanner}>{formError}</div>}
                {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

                <div className={styles.fieldGroup}>
                  <label htmlFor="invCustomer">Select Client (My Approved Clients Only) *</label>
                  <select 
                    id="invCustomer" 
                    name="customerId" 
                    required 
                    defaultValue={selectedCustomerId || ""}
                  >
                    <option value="">-- Choose an Approved Client --</option>
                    {myClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="invProject">Associated Project (Optional)</label>
                  <select id="invProject" name="projectId">
                    <option value="">-- Standalone Billing / Not Linked to Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.customer?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="invSubtotal">Subtotal Amount (₹) *</label>
                    <input 
                      type="number" 
                      id="invSubtotal" 
                      name="subtotal" 
                      required 
                      step="0.01"
                      min="1"
                      placeholder="e.g. 25000"
                      onChange={(e) => setInvSubtotal(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.fieldGroup} style={{ display: "none" }}>
                    <input type="hidden" name="gstPercentage" value="0" />
                  </div>
                </div>

                {/* Auto Calculated Preview (0% Tax) */}
                <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "12px 16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total Requested (0% Tax):</span>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#10b981" }}>
                      ₹{invSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                    Subtotal: ₹{invSubtotal.toLocaleString("en-IN")}<br/>
                    Tax (0%): ₹0.00
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="invNotes">Billing Notes / Milestone Remarks</label>
                  <textarea 
                    id="invNotes" 
                    name="notes" 
                    rows={3}
                    placeholder="e.g. 50% advance payment for phase 1 UI kickoff, or final invoice on delivery..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending || myClients.length === 0}>
                  {isPending ? "Submitting..." : "Submit Invoice Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REQUEST PROJECT / DEAL HANDOVER MODAL */}
      {isProjectModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Briefcase size={20} color="#3b82f6" />
                Handover Won Deal to Project Team
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorBanner}>{formError}</div>}
                {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

                <div className={styles.fieldGroup}>
                  <label htmlFor="projectName">Project Title *</label>
                  <input 
                    type="text" 
                    id="projectName" 
                    name="name" 
                    required 
                    placeholder="e.g. Al-Madina POS & Cloud Multi-Branch System" 
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="projCustomer">Client (My Approved Clients Only) *</label>
                    <select 
                      id="projCustomer" 
                      name="customerId" 
                      required 
                      defaultValue={selectedCustomerId || ""}
                    >
                      <option value="">-- Choose an Approved Client --</option>
                      {myClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="projType">Project Type *</label>
                    <select id="projType" name="type" defaultValue="Website & Web App">
                      <option value="Website & Web App">Website & Web App</option>
                      <option value="Mobile Application">Mobile Application (iOS/Android)</option>
                      <option value="POS & Billing System Setup">POS &amp; Barcode Billing System Setup</option>
                      <option value="E-Commerce Store">E-Commerce Store</option>
                      <option value="Custom ERP & Software">Custom ERP & Software</option>
                      <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                      <option value="Maintenance & AMC">Maintenance & AMC</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="estimatedBudget">Total Deal Budget (₹)</label>
                    <input 
                      type="number" 
                      id="estimatedBudget" 
                      name="estimatedBudget" 
                      placeholder="e.g. 150000" 
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="projPriority">Execution Priority</label>
                    <select id="projPriority" name="priority" defaultValue="MEDIUM">
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Standard Medium</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent Express Delivery</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="startDate">Project Start Date</label>
                    <input 
                      type="date" 
                      id="startDate" 
                      name="startDate" 
                      defaultValue={new Date().toISOString().split("T")[0]} 
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="endDate">Expected Delivery Date</label>
                    <input type="date" id="endDate" name="endDate" />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="projDesc">Scope of Work & Client Specifications</label>
                  <textarea 
                    id="projDesc" 
                    name="description" 
                    rows={4}
                    placeholder="List key requirements, deliverables agreed with client, credentials, hardware needed..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending || myClients.length === 0}>
                  {isPending ? "Creating Project..." : "Handover Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. REQUEST SERVICE / PACKAGE MODAL */}
      {isServiceModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <RefreshCw size={20} color="#f59e0b" />
                Provision Service Package / Subscription
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleServiceSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorBanner}>{formError}</div>}
                {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

                <div className={styles.fieldGroup}>
                  <label htmlFor="srvCustomer">Select Client (My Approved Clients Only) *</label>
                  <select 
                    id="srvCustomer" 
                    name="customerId" 
                    required 
                    defaultValue={selectedCustomerId || ""}
                  >
                    <option value="">-- Choose an Approved Client --</option>
                    {myClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="packageName">Package Name *</label>
                    <input 
                      type="text" 
                      id="packageName" 
                      name="packageName" 
                      required 
                      placeholder="e.g. Annual Website AMC & Cloud Backup" 
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="packageType">Category *</label>
                    <select id="packageType" name="packageType" defaultValue="WEBSITE">
                      <option value="WEBSITE">Website Maintenance & AMC</option>
                      <option value="SOFTWARE">Software & POS Support</option>
                      <option value="SEO">Monthly SEO & Content</option>
                      <option value="MARKETING">Social Media Marketing</option>
                      <option value="ECOMMERCE">E-Commerce Management</option>
                      <option value="CUSTOM">Custom SLA Retainer</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="packagePrice">Subscription Price (₹) *</label>
                    <input 
                      type="number" 
                      id="packagePrice" 
                      name="packagePrice" 
                      required 
                      step="0.01"
                      placeholder="e.g. 18000" 
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="contractPeriod">Billing Cycle / Duration (Months)</label>
                    <select id="contractPeriod" name="contractPeriod" defaultValue="12">
                      <option value="1">1 Month (Monthly)</option>
                      <option value="3">3 Months (Quarterly)</option>
                      <option value="6">6 Months (Half-Yearly)</option>
                      <option value="12">12 Months (Annual Plan)</option>
                      <option value="24">24 Months (2-Year Term)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="purchaseDate">Start Date</label>
                    <input 
                      type="date" 
                      id="purchaseDate" 
                      name="purchaseDate" 
                      defaultValue={new Date().toISOString().split("T")[0]} 
                    />
                  </div>

                  <div className={styles.fieldGroup} style={{ justifyContent: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "24px" }}>
                      <input type="checkbox" name="isLifetime" />
                      Lifetime Plan (No Renewal Expiry)
                    </label>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="srvNotes">Service Scope / Special Terms</label>
                  <textarea 
                    id="srvNotes" 
                    name="notes" 
                    rows={3}
                    placeholder="Included monthly hours, backup schedule, server IP or domain details..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending || myClients.length === 0}>
                  {isPending ? "Provisioning..." : "Provision Service Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. QUICK ADD CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <User size={20} color="var(--brand-primary)" />
                Quick Client Onboarding
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeAllModals}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorBanner}>{formError}</div>}
                {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="custName">Customer Full Name *</label>
                    <input type="text" id="custName" name="name" required placeholder="e.g. Rajesh Kumar" />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="custPhone">Phone Number *</label>
                    <input type="tel" id="custPhone" name="phone" required placeholder="e.g. 9876543210" />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="custEmail">Email Address</label>
                    <input type="email" id="custEmail" name="email" placeholder="client@example.com" />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="custCompany">Company / Business Name</label>
                    <input type="text" id="custCompany" name="company" placeholder="e.g. Apex Retailers Pvt Ltd" />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="custGst">GST Number (Optional)</label>
                    <input type="text" id="custGst" name="gstNumber" placeholder="32AAAAA0000A1Z5" />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="custAddress">City / Location</label>
                    <input type="text" id="custAddress" name="address" placeholder="e.g. Calicut, Kerala" />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Creating..." : "Save Client Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
