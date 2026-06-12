"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { uploadQuotationPdf } from "@/app/quotation-requests/actions";

export default function QuotationPdfUploader({ requestId }: { requestId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("pdf", e.target.files[0]);
      
      await uploadQuotationPdf(formData);
      alert("PDF uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--surface-background)', border: '1px dashed var(--brand-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <input 
        type="file" 
        id="pdfUpload" 
        accept="application/pdf"
        style={{ display: "none" }} 
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <label htmlFor="pdfUpload" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {isUploading ? <Loader2 size={24} className="spin" color="var(--brand-primary)" /> : <UploadCloud size={24} color="var(--brand-primary)" />}
        <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
          {isUploading ? "Uploading PDF to Cloud..." : "Upload Official PDF from Aronium"}
        </span>
      </label>
    </div>
  );
}
