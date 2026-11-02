"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Monitor, LayoutDashboard, Receipt, Package, BarChart3, Plus, ArrowRight } from "lucide-react";

interface Props {
  aroniumConsole: React.ReactNode;
  crmDashboard: React.ReactNode;
  totalBilled: number;
  totalCollected: number;
  totalDue: number;
}

export default function ExecutiveDashboardWrapper({
  aroniumConsole,
  crmDashboard,
  totalBilled,
  totalCollected,
  totalDue,
}: Props) {
  // Modes: "ARONIUM" (Aronium Lite Management Console) or "CRM" (CRM Operations)
  // Default to ARONIUM so the user immediately sees the uploaded Aronium UI on the site!
  const [viewMode, setViewMode] = useState<"ARONIUM" | "CRM">("ARONIUM");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode")?.toUpperCase();
      if (modeParam === "CRM") {
        setViewMode("CRM");
        return;
      }
      if (modeParam === "ARONIUM") {
        setViewMode("ARONIUM");
        return;
      }

      const saved = localStorage.getItem("technext_dashboard_mode");
      if (saved === "CRM" || saved === "ARONIUM") {
        setViewMode(saved);
      }
    }
  }, []);

  const switchMode = (mode: "ARONIUM" | "CRM") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("technext_dashboard_mode", mode);
    }
  };

  const formatCurrency = (amt: number) => {
    return Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div>
      {/* Top Suite Switcher Banner */}
      <div style={{
        background: viewMode === "ARONIUM" ? "#101418" : "#ffffff",
        color: viewMode === "ARONIUM" ? "#e2e8f0" : "#0f172a",
        padding: "10px 20px",
        borderBottom: viewMode === "ARONIUM" ? "1px solid #232c34" : "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        transition: "all 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#00a2ed" }}>
            Active Interface:
          </span>

          <div style={{
            display: "inline-flex",
            background: viewMode === "ARONIUM" ? "#1c232a" : "#f1f5f9",
            borderRadius: "6px",
            padding: "3px",
            border: viewMode === "ARONIUM" ? "1px solid #2a3742" : "1px solid #cbd5e1"
          }}>
            <button
              type="button"
              onClick={() => switchMode("ARONIUM")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "4px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: viewMode === "ARONIUM" ? "#00a2ed" : "transparent",
                color: viewMode === "ARONIUM" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <Monitor size={14} /> Aronium Management Suite
            </button>
            <button
              type="button"
              onClick={() => switchMode("CRM")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "4px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: viewMode === "CRM" ? "#4f46e5" : "transparent",
                color: viewMode === "CRM" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <LayoutDashboard size={14} /> CRM Operations Overview
            </button>
          </div>
        </div>

        {/* Quick Aronium Shortcuts */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href="/billing?tab=dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#00a2ed",
              background: "rgba(0, 162, 237, 0.1)",
              border: "1px solid rgba(0, 162, 237, 0.3)"
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/billing?tab=documents"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#00a2ed",
              background: "rgba(0, 162, 237, 0.1)",
              border: "1px solid rgba(0, 162, 237, 0.3)"
            }}
          >
            Documents
          </Link>
          <Link
            href="/billing?tab=products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#00a2ed",
              background: "rgba(0, 162, 237, 0.1)",
              border: "1px solid rgba(0, 162, 237, 0.3)"
            }}
          >
            Products
          </Link>
          <Link
            href="/billing?tab=reporting"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#00a2ed",
              background: "rgba(0, 162, 237, 0.1)",
              border: "1px solid rgba(0, 162, 237, 0.3)"
            }}
          >
            Reporting
          </Link>
          <Link
            href="/billing/new?type=invoice"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              textDecoration: "none",
              color: "#ffffff",
              background: "#00a2ed",
            }}
          >
            <Plus size={12} /> New Bill
          </Link>
        </div>
      </div>

      {/* Render View Mode */}
      {viewMode === "ARONIUM" ? (
        <div>{aroniumConsole}</div>
      ) : (
        <div>{crmDashboard}</div>
      )}
    </div>
  );
}
