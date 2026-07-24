"use client";

import { useState } from "react";
import { Download, Mail, FileText } from "lucide-react";
import { generateFinancialPDF, downloadBlobAsFile } from "@/lib/erp/pdfGenerator";
import { generateCSV } from "@/lib/erp/csvGenerator";
import EmailReportDialog from "./EmailReportDialog";

interface ReportExportHeaderProps {
  title: string;
  subtitle?: string;
  data: any[][];
  columns: string[];
  chartElementId?: string;
}

export default function ReportExportHeader({
  title,
  subtitle,
  data,
  columns,
  chartElementId
}: ReportExportHeaderProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const blob = await generateFinancialPDF({
        title,
        subtitle,
        columns,
        data,
        chartElementId
      });
      downloadBlobAsFile(blob, `${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const blob = generateCSV(columns, data);
      downloadBlobAsFile(blob, `${title.replace(/\s+/g, '_')}.csv`);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text-primary)" }}>{title}</h2>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", cursor: isExporting ? "not-allowed" : "pointer", border: "1px solid var(--surface-border)", borderRadius: "6px", background: "var(--surface-color)", color: "var(--text-primary)" }}
        >
          <FileText size={16} /> PDF
        </button>
        <button 
          onClick={handleExportCSV} 
          style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", border: "1px solid var(--surface-border)", borderRadius: "6px", background: "var(--surface-color)", color: "var(--text-primary)" }}
        >
          <Download size={16} /> CSV
        </button>
        <button 
          onClick={() => setIsEmailDialogOpen(true)}
          style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", border: "none", borderRadius: "6px", background: "#8B5CF6", color: "white" }}
        >
          <Mail size={16} /> Email
        </button>
      </div>

      {isEmailDialogOpen && (
        <EmailReportDialog 
          isOpen={isEmailDialogOpen} 
          onClose={() => setIsEmailDialogOpen(false)} 
          reportData={{ title, subtitle, columns, data, chartElementId }}
        />
      )}
    </div>
  );
}
