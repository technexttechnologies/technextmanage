"use client";

import { useState } from "react";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { uploadDocument } from "@/app/documents/actions";

export default function DocumentUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadDocument(formData);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message || "Unknown error"}. Check console for details.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: "24px", background: "var(--surface-card)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
      <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <UploadCloud size={20} /> Upload New Document
      </h2>

      {!file ? (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? "var(--brand-primary)" : "var(--surface-border)"}`,
            borderRadius: "var(--radius-md)",
            padding: "40px",
            textAlign: "center",
            background: isDragging ? "rgba(79, 70, 229, 0.05)" : "var(--surface-background)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <input 
            type="file" 
            id="fileUpload" 
            style={{ display: "none" }} 
            onChange={handleFileChange}
          />
          <label htmlFor="fileUpload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <UploadCloud size={32} color="var(--brand-primary)" />
            <div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Click to upload or drag and drop</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>SVG, PNG, JPG, PDF, DOCX (max 4.5MB)</p>
            </div>
          </label>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-background)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#E0E7FF", color: "#4F46E5", borderRadius: "8px" }}>
              <File size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px" }}>{file.name}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              onClick={() => setFile(null)} 
              disabled={isUploading}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "8px" }}
            >
              <X size={18} />
            </button>
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {isUploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : "Upload File"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
