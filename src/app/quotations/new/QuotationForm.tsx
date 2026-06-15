"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, UploadCloud, Loader2, Plus, Trash2 } from "lucide-react";
import styles from "../../projects/new/page.module.css";
import { createQuotation } from "../actions";

export default function QuotationForm({ customers }: { customers: any[] }) {
  const [isParsing, setIsParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    quotationNumber: `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    expiryDate: "",
    status: "DRAFT",
    companyName: "",
    companyAddress: "",
    companyGst: "",
    notes: "",
  });

  const [items, setItems] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setError(null);

    const form = new FormData();
    form.append("file", selectedFile);

    try {
      const res = await fetch("/api/ai/parse-quotation", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to parse");

      setFormData(prev => ({
        ...prev,
        companyName: data.companyName || prev.companyName,
        companyAddress: data.companyAddress || prev.companyAddress,
        companyGst: data.companyGst || prev.companyGst,
        expiryDate: data.expiryDate ? data.expiryDate.split('T')[0] : prev.expiryDate,
      }));

      setItems(data.items || []);
      setTerms(data.terms || []);
      setMilestones(data.milestones || []);
      setMeta(data.meta || {});

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'price' || field === 'quantity') {
      newItems[index].total = Number(newItems[index].price || 0) * Number(newItems[index].quantity || 1);
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { name: "", description: "", quantity: 1, price: 0, total: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const addTerm = () => setTerms([...terms, { content: "", order: terms.length + 1 }]);
  const removeTerm = (index: number) => setTerms(terms.filter((_, i) => i !== index));

  const addMilestone = () => setMilestones([...milestones, { name: "", duration: "", order: milestones.length + 1 }]);
  const removeMilestone = (index: number) => setMilestones(milestones.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const gstPercentage = 18;
  const totalAmount = (subtotal * (1 + gstPercentage / 100)).toFixed(2);

  return (
    <form action={createQuotation} className={styles.formCard} encType="multipart/form-data">
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}><UploadCloud size={18} /> Upload PDF (AI Extraction)</h2>
        <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px'}}>
          Upload a quotation PDF. The AI will automatically extract items, terms, and timelines.
        </p>
        <div className={styles.inputGroup}>
          <input type="file" id="pdfFile" name="pdfFile" accept="application/pdf,.docx" onChange={handleFileUpload} />
        </div>
        {isParsing && <p style={{ color: "var(--brand-primary)", marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}><Loader2 className="animate-spin" size={16} /> AI is reading the document...</p>}
        {error && <p style={{ color: "var(--danger-color)", marginTop: "10px" }}>{error}</p>}
      </div>

      <div className={styles.formSection} style={{marginTop: '24px'}}>
        <h2 className={styles.sectionTitle}>Basic Details</h2>
        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label htmlFor="customerId">Select Customer *</label>
            <select id="customerId" name="customerId" required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
              <option value="">-- Choose a Customer --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.company ? `(${customer.company})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="quotationNumber">Quotation Number *</label>
            <input type="text" id="quotationNumber" name="quotationNumber" required value={formData.quotationNumber} onChange={e => setFormData({...formData, quotationNumber: e.target.value})} />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label htmlFor="date">Issue Date *</label>
            <input type="date" id="date" name="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="expiryDate">Expiry Date</label>
            <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
          </div>
        </div>
      </div>

      <div className={styles.formSection} style={{marginTop: '24px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className={styles.sectionTitle} style={{margin: 0}}>Service Items</h2>
          <button type="button" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
            <Plus size={14} /> Add Item
          </button>
        </div>
        
        {items.map((item, index) => (
          <div key={index} style={{ border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px', marginBottom: '16px', position: 'relative' }}>
            <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={16}/></button>
            <div className={styles.grid2} style={{ marginBottom: '12px' }}>
              <div className={styles.inputGroup} style={{margin: 0}}>
                <label>Service Name</label>
                <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '12px' }}>
                <div className={styles.inputGroup} style={{margin: 0}}>
                  <label>Qty</label>
                  <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required min="1" />
                </div>
                <div className={styles.inputGroup} style={{margin: 0}}>
                  <label>Price (₹)</label>
                  <input type="number" step="0.01" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} required />
                </div>
                <div className={styles.inputGroup} style={{margin: 0}}>
                  <label>Total (₹)</label>
                  <input type="number" step="0.01" value={item.total} readOnly style={{backgroundColor: 'var(--background)'}} />
                </div>
              </div>
            </div>
            <div className={styles.inputGroup} style={{margin: 0}}>
              <label>Description</label>
              <textarea value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} rows={2} />
            </div>
          </div>
        ))}

        <div className={styles.grid2} style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-background)', borderRadius: '8px' }}>
          <div className={styles.inputGroup} style={{margin: 0}}>
            <label>Subtotal (₹)</label>
            <input type="number" step="0.01" name="subtotal" value={subtotal.toFixed(2)} readOnly style={{backgroundColor: 'var(--background)'}} />
          </div>
          <div className={styles.inputGroup} style={{margin: 0}}>
            <label>Grand Total + {gstPercentage}% GST (₹)</label>
            <input type="number" step="0.01" value={totalAmount} readOnly style={{fontWeight: 'bold', backgroundColor: 'var(--background)'}} />
          </div>
        </div>
      </div>

      <div className={styles.formSection} style={{marginTop: '24px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className={styles.sectionTitle} style={{margin: 0}}>Terms & Conditions</h2>
          <button type="button" onClick={addTerm} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
            <Plus size={14} /> Add Term
          </button>
        </div>
        {terms.map((term, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input type="text" value={term.content} onChange={e => { const newTerms=[...terms]; newTerms[index].content=e.target.value; setTerms(newTerms); }} style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)'}} />
            <button type="button" onClick={() => removeTerm(index)} style={{ padding: '10px', background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16}/></button>
          </div>
        ))}
      </div>

      <div className={styles.formSection} style={{marginTop: '24px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className={styles.sectionTitle} style={{margin: 0}}>Milestones / Timeline</h2>
          <button type="button" onClick={addMilestone} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
            <Plus size={14} /> Add Milestone
          </button>
        </div>
        {milestones.map((ms, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input type="text" placeholder="Milestone Name" value={ms.name} onChange={e => { const newMs=[...milestones]; newMs[index].name=e.target.value; setMilestones(newMs); }} style={{flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)'}} />
            <input type="text" placeholder="Duration (e.g. 2 weeks)" value={ms.duration} onChange={e => { const newMs=[...milestones]; newMs[index].duration=e.target.value; setMilestones(newMs); }} style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)'}} />
            <button type="button" onClick={() => removeMilestone(index)} style={{ padding: '10px', background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16}/></button>
          </div>
        ))}
      </div>

      {/* Hidden inputs for JSON payload */}
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="terms" value={JSON.stringify(terms)} />
      <input type="hidden" name="milestones" value={JSON.stringify(milestones)} />
      <input type="hidden" name="meta" value={JSON.stringify(meta)} />
      <input type="hidden" name="companyName" value={formData.companyName} />
      <input type="hidden" name="companyAddress" value={formData.companyAddress} />
      <input type="hidden" name="companyGst" value={formData.companyGst} />
      <input type="hidden" name="status" value={formData.status} />

      <div className={styles.formActions}>
        <Link href="/quotations" className="btn-secondary">Cancel</Link>
        <button type="submit" className="btn-primary" disabled={isParsing}>
          <Save size={18} />
          Save & Generate Dynamic Page
        </button>
      </div>
    </form>
  );
}
