"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Monitor, 
  TrendingUp, 
  LayoutDashboard, 
  Plus, 
  FileSignature, 
  Users
} from "lucide-react";

interface Props {
  aroniumConsole: React.ReactNode;
  salesDashboard: React.ReactNode;
  crmDashboard: React.ReactNode;
  totalBilled: number;
  totalCollected: number;
  totalDue: number;
  pendingQuotesCount: number;
  pendingInvoicesCount: number;
  pendingAccessCount: number;
}

export default function ExecutiveDashboardWrapper({
  aroniumConsole,
  salesDashboard,
  crmDashboard,
  pendingQuotesCount,
  pendingInvoicesCount,
}: Props) {
  // Modes: "BILLING" (Billing & Invoicing Console), "SALES" (Sales Operations & Deal Pipeline), or "CRM" (CRM Operations)
  const [viewMode, setViewMode] = useState<"BILLING" | "SALES" | "CRM">("BILLING");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode")?.toUpperCase() || params.get("view")?.toUpperCase();
      if (modeParam === "SALES") {
        setViewMode("SALES");
        return;
      }
      if (modeParam === "CRM") {
        setViewMode("CRM");
        return;
      }
      if (modeParam === "BILLING" || modeParam === "ARONIUM") {
        setViewMode("BILLING");
        return;
      }

      const saved = localStorage.getItem("technext_dashboard_mode");
      if (saved === "CRM" || saved === "BILLING" || saved === "SALES") {
        setViewMode(saved as any);
      } else if (saved === "ARONIUM") {
        setViewMode("BILLING");
      }
    }
  }, []);

  const switchMode = (mode: "BILLING" | "SALES" | "CRM") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("technext_dashboard_mode", mode);
      const url = new URL(window.location.href);
      url.searchParams.set("view", mode.toLowerCase());
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden", backgroundColor: "#f8fafc" }}>
      {/* 1. Executive Top Suite Navigation Bar (Clean Synchronized Light Theme) */}
      <header style={{
        backgroundColor: "#ffffff",
        color: "#0f172a",
        padding: "12px 16px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
      }}>
        {/* Left: Suite Switcher Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ 
            fontSize: "11px", 
            fontWeight: 700, 
            textTransform: "uppercase", 
            letterSpacing: "0.06em", 
            color: "#4f46e5",
            marginRight: "4px"
          }}>
            Dashboard View:
          </span>

          <div style={{
            display: "inline-flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "8px",
            padding: "3px",
            border: "1px solid #e2e8f0",
            maxWidth: "100%",
            overflowX: "auto",
            scrollbarWidth: "none"
          }}>
            {/* Tab 1: Executive Billing & Invoicing */}
            <button
              type="button"
              onClick={() => switchMode("BILLING")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: viewMode === "BILLING" ? "#0284c7" : "transparent",
                color: viewMode === "BILLING" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
                boxShadow: viewMode === "BILLING" ? "0 2px 4px rgba(2, 132, 199, 0.25)" : "none"
              }}
            >
              <Monitor size={14} /> Executive Billing &amp; Management
            </button>

            {/* Tab 2: Sales Operations & Deal Pipeline */}
            <button
              type="button"
              onClick={() => switchMode("SALES")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: viewMode === "SALES" ? "#10b981" : "transparent",
                color: viewMode === "SALES" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
                boxShadow: viewMode === "SALES" ? "0 2px 4px rgba(16, 185, 129, 0.25)" : "none"
              }}
            >
              <TrendingUp size={14} /> Sales &amp; Deals
              {(pendingQuotesCount > 0 || pendingInvoicesCount > 0) && (
                <span style={{
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: 800,
                  backgroundColor: viewMode === "SALES" ? "#ffffff" : "#10b981",
                  color: viewMode === "SALES" ? "#10b981" : "#ffffff",
                }}>
                  {pendingQuotesCount + pendingInvoicesCount}
                </span>
              )}
            </button>

            {/* Tab 3: CRM Operations Overview */}
            <button
              type="button"
              onClick={() => switchMode("CRM")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: viewMode === "CRM" ? "#4f46e5" : "transparent",
                color: viewMode === "CRM" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
                boxShadow: viewMode === "CRM" ? "0 2px 4px rgba(79, 70, 229, 0.25)" : "none"
              }}
            >
              <LayoutDashboard size={14} /> CRM Operations
            </button>
          </div>
        </div>

        {/* Right: Quick Action Shortcuts */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          flexWrap: "nowrap",
          overflowX: "auto",
          maxWidth: "100%",
          paddingBottom: "2px"
        }}>
          <Link
            href="/billing/new?type=invoice"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              color: "#ffffff",
              backgroundColor: "#0284c7",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(2, 132, 199, 0.25)"
            }}
          >
            <Plus size={13} /> + New Bill
          </Link>

          <Link
            href="/sales?tab=quotations"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#334155",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            <FileSignature size={13} color="#10b981" /> Quote Requests
            {pendingQuotesCount > 0 && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>({pendingQuotesCount})</span>
            )}
          </Link>

          <Link
            href="/customers/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#334155",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            <Users size={13} color="#6366f1" /> + Add Client
          </Link>
        </div>
      </header>

      {/* 2. Render Active Suite */}
      {viewMode === "BILLING" && (
        <section aria-label="Executive Billing & Management Console">
          {aroniumConsole}
        </section>
      )}

      {viewMode === "SALES" && (
        <section aria-label="Sales Operations & Deal Pipeline" style={{ padding: "16px 0" }}>
          {salesDashboard}
        </section>
      )}

      {viewMode === "CRM" && (
        <section aria-label="CRM Operations Overview">
          {crmDashboard}
        </section>
      )}
    </div>
  );
}
