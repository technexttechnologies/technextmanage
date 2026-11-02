"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Monitor, 
  TrendingUp, 
  LayoutDashboard, 
  Receipt, 
  Package, 
  BarChart3, 
  Plus, 
  FileSignature, 
  Users, 
  Briefcase,
  Layers,
  ArrowRight
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
  totalBilled,
  totalCollected,
  totalDue,
  pendingQuotesCount,
  pendingInvoicesCount,
  pendingAccessCount,
}: Props) {
  // Modes: "ARONIUM" (Aronium Lite Management Console), "SALES" (Sales Operations & Deal Pipeline), or "CRM" (CRM Operations)
  const [viewMode, setViewMode] = useState<"ARONIUM" | "SALES" | "CRM">("ARONIUM");

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
      if (modeParam === "ARONIUM" || modeParam === "BILLING") {
        setViewMode("ARONIUM");
        return;
      }

      const saved = localStorage.getItem("technext_dashboard_mode");
      if (saved === "CRM" || saved === "ARONIUM" || saved === "SALES") {
        setViewMode(saved as any);
      }
    }
  }, []);

  const switchMode = (mode: "ARONIUM" | "SALES" | "CRM") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("technext_dashboard_mode", mode);
      const url = new URL(window.location.href);
      url.searchParams.set("view", mode.toLowerCase());
      window.history.replaceState({}, "", url.toString());
    }
  };

  const formatCurrency = (amt: number) => {
    return Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {/* 1. Executive Top Suite Navigation Bar */}
      <header style={{
        backgroundColor: viewMode === "ARONIUM" ? "#101418" : "#ffffff",
        color: viewMode === "ARONIUM" ? "#e2e8f0" : "#0f172a",
        padding: "12px 16px",
        borderBottom: viewMode === "ARONIUM" ? "1px solid #232c34" : "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        {/* Left: Suite Switcher Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ 
            fontSize: "11px", 
            fontWeight: 700, 
            textTransform: "uppercase", 
            letterSpacing: "0.06em", 
            color: viewMode === "ARONIUM" ? "#00a2ed" : "#4f46e5",
            marginRight: "4px"
          }}>
            Hub:
          </span>

          <div style={{
            display: "inline-flex",
            backgroundColor: viewMode === "ARONIUM" ? "#1c232a" : "#f1f5f9",
            borderRadius: "8px",
            padding: "3px",
            border: viewMode === "ARONIUM" ? "1px solid #2a3742" : "1px solid #cbd5e1",
            maxWidth: "100%",
            overflowX: "auto",
            scrollbarWidth: "none"
          }}>
            {/* Tab 1: Aronium Billing & Management */}
            <button
              type="button"
              onClick={() => switchMode("ARONIUM")}
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
                backgroundColor: viewMode === "ARONIUM" ? "#00a2ed" : "transparent",
                color: viewMode === "ARONIUM" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
                boxShadow: viewMode === "ARONIUM" ? "0 2px 4px rgba(0, 162, 237, 0.3)" : "none"
              }}
            >
              <Monitor size={14} /> Aronium Billing &amp; Management
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
                color: viewMode === "SALES" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
                boxShadow: viewMode === "SALES" ? "0 2px 4px rgba(16, 185, 129, 0.3)" : "none"
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
                color: viewMode === "CRM" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
                boxShadow: viewMode === "CRM" ? "0 2px 4px rgba(79, 70, 229, 0.3)" : "none"
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
              backgroundColor: "#00a2ed",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(0, 162, 237, 0.3)"
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
              color: viewMode === "ARONIUM" ? "#e2e8f0" : "#334155",
              backgroundColor: viewMode === "ARONIUM" ? "#1e2730" : "#f1f5f9",
              border: viewMode === "ARONIUM" ? "1px solid #2d3b47" : "1px solid #cbd5e1",
              whiteSpace: "nowrap"
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
              color: viewMode === "ARONIUM" ? "#e2e8f0" : "#334155",
              backgroundColor: viewMode === "ARONIUM" ? "#1e2730" : "#f1f5f9",
              border: viewMode === "ARONIUM" ? "1px solid #2d3b47" : "1px solid #cbd5e1",
              whiteSpace: "nowrap"
            }}
          >
            <Users size={13} color="#6366f1" /> + Add Client
          </Link>
        </div>
      </header>

      {/* 2. Render Active Suite */}
      {viewMode === "ARONIUM" && (
        <section aria-label="Aronium Management & Billing Console">
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
