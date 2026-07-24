"use client";

import { useState } from "react";
import { generateFinancialPDF } from "@/lib/erp/pdfGenerator";
import { generateCSV } from "@/lib/erp/csvGenerator";
import { sendReportEmail } from "@/app/erp/finance/actions";
import { X, Loader2 } from "lucide-react";

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    title: string;
    subtitle?: string;
    columns: string[];
    data: any[][];
    chartElementId?: string;
  };
}

export default function EmailReportDialog({ isOpen, onClose, reportData }: EmailReportDialogProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(`Report: ${reportData.title}`);
  const [body, setBody] = useState(`Please find attached the report: ${reportData.title}.\n\nBest regards,\nTechNext Operations`);
  
  const [includePDF, setIncludePDF] = useState(true);
  const [includeCSV, setIncludeCSV] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // The dataUrl is like "data:application/pdf;base64,JVBER..."
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!includePDF && !includeCSV) {
      alert("Please select at least one attachment format.");
      return;
    }
    
    if (!to) {
      alert("Please enter a recipient email address.");
      return;
    }

    try {
      setIsSending(true);
      const attachments = [];

      if (includePDF) {
        const pdfBlob = await generateFinancialPDF(reportData);
        const pdfBase64 = await blobToBase64(pdfBlob);
        attachments.push({
          filename: `${reportData.title.replace(/\s+/g, '_')}.pdf`,
          content: pdfBase64,
          contentType: "application/pdf"
        });
      }

      if (includeCSV) {
        const csvBlob = generateCSV(reportData.columns, reportData.data);
        const csvBase64 = await blobToBase64(csvBlob);
        attachments.push({
          filename: `${reportData.title.replace(/\s+/g, '_')}.csv`,
          content: csvBase64,
          contentType: "text/csv"
        });
      }

      await sendReportEmail({
        to,
        cc,
        bcc,
        subject,
        body,
        attachments
      });

      alert("Email sent successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please check your settings.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "var(--surface-color, #ffffff)", padding: "24px", borderRadius: "8px", width: "100%", maxWidth: "500px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto", position: "relative"
      }}>
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
        >
          <X size={20} />
        </button>
        
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px", color: "var(--text-primary)" }}>Email Report</h2>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>To *</label>
            <input 
              type="email" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--surface-border)", background: "var(--background-color)", color: "var(--text-primary)" }} 
              placeholder="recipient@example.com"
            />
          </div>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>CC</label>
              <input 
                type="text" 
                value={cc} 
                onChange={e => setCc(e.target.value)} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--surface-border)", background: "var(--background-color)", color: "var(--text-primary)" }} 
                placeholder="Comma separated emails"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>BCC</label>
              <input 
                type="text" 
                value={bcc} 
                onChange={e => setBcc(e.target.value)} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--surface-border)", background: "var(--background-color)", color: "var(--text-primary)" }} 
                placeholder="Comma separated emails"
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--surface-border)", background: "var(--background-color)", color: "var(--text-primary)" }} 
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Body</label>
            <textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              required 
              rows={4}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--surface-border)", resize: "vertical", background: "var(--background-color)", color: "var(--text-primary)" }} 
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Attachments</label>
            <div style={{ display: "flex", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-primary)" }}>
                <input 
                  type="checkbox" 
                  checked={includePDF} 
                  onChange={e => setIncludePDF(e.target.checked)} 
                />
                PDF Report
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-primary)" }}>
                <input 
                  type="checkbox" 
                  checked={includeCSV} 
                  onChange={e => setIncludeCSV(e.target.checked)} 
                />
                CSV Data
              </label>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSending}
              style={{ padding: "8px 16px", border: "1px solid var(--surface-border)", borderRadius: "4px", background: "transparent", cursor: "pointer", color: "var(--text-primary)" }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSending}
              style={{ 
                padding: "8px 16px", border: "none", borderRadius: "4px", background: "#8B5CF6", color: "white", 
                cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" 
              }}
            >
              {isSending ? <Loader2 size={16} /> : null}
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
