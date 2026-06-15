"use client";

import { useState } from "react";
import { UploadCloud, Loader2, Save, Trash2, Edit3 } from "lucide-react";
import { uploadInvoicePdf } from "@/app/invoice-requests/actions";

export default function InvoicePdfUploader({ requestId }: { requestId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setIsParsing(true);
    
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res = await fetch("/api/ai/parse-quotation", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse");
      
      setParsedData(data);
    } catch (err: any) {
      console.error(err);
      alert(`AI Extraction failed: ${err.message}. You can try again or upload manually.`);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveAndUpload = async () => {
    if (!file || !parsedData) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("pdf", file);
      formData.append("structuredData", JSON.stringify(parsedData));
      
      await uploadInvoicePdf(formData);
      alert("Invoice PDF and AI Data uploaded successfully!");
      setParsedData(null);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...(parsedData.items || [])];
    newItems[index][field] = value;
    if (field === 'price' || field === 'quantity') {
      newItems[index].total = Number(newItems[index].price || 0) * Number(newItems[index].quantity || 1);
    }
    setParsedData({ ...parsedData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...(parsedData.items || [])].filter((_, i) => i !== index);
    setParsedData({ ...parsedData, items: newItems });
  };

  if (isParsing) {
    return (
      <div style={{ marginTop: '16px', padding: '32px', background: 'var(--surface-background)', border: '1px dashed var(--brand-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} className="animate-spin" color="var(--brand-primary)" />
        <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>AI is reading the document...</span>
      </div>
    );
  }

  if (parsedData) {
    const subtotal = parsedData.items?.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0) || 0;
    const gstPercentage = parsedData.gstPercentage || 18;
    const totalAmount = subtotal * (1 + gstPercentage / 100);

    return (
      <div style={{ marginTop: '16px', padding: '16px', background: 'white', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
        <h4 style={{ fontSize: '15px', color: 'var(--brand-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Edit3 size={16} /> Verify AI Extraction</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {(parsedData.items || []).map((item: any, index: number) => (
            <div key={index} style={{ border: '1px solid var(--surface-border)', padding: '12px', borderRadius: '8px', position: 'relative', background: 'var(--surface-background)' }}>
              <button onClick={() => removeItem(index)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={14}/></button>
              <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} style={{ width: '85%', marginBottom: '8px', padding: '6px', borderRadius: '4px', border: '1px solid var(--surface-border)' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid var(--surface-border)' }} />
                <input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--surface-border)' }} />
                <span style={{ padding: '6px', fontWeight: 'bold' }}>₹{item.total}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
          <span>Calculated Total:</span>
          <span style={{ color: '#166534' }}>₹{totalAmount.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { setParsedData(null); setFile(null); }} className="btn-secondary" style={{ flex: 1, padding: '8px' }}>Cancel</button>
          <button onClick={handleSaveAndUpload} disabled={isUploading} className="btn-primary" style={{ flex: 2, padding: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Confirm & Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--surface-background)', border: '1px dashed var(--brand-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <input 
        type="file" 
        id="pdfUploadInv" 
        accept="application/pdf"
        style={{ display: "none" }} 
        onChange={handleFileSelect}
        disabled={isUploading || isParsing}
      />
      <label htmlFor="pdfUploadInv" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <UploadCloud size={24} color="var(--brand-primary)" />
        <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
          Upload Official Invoice from Aronium
        </span>
      </label>
    </div>
  );
}
