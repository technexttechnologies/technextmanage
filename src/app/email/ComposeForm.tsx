"use client";

import { useState } from "react";
import { sendComposedEmail } from "./actions";
import { Mail, Settings, Send, MessageSquare, Sparkles, Phone } from "lucide-react";

export default function ComposeForm({ customers, isConfigured, templates }: any) {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const customer = customers.find((c: any) => c.id === selectedCustomerId);
  const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId);
  const isWhatsApp = selectedTemplate?.type === "WHATSAPP";

  const handleTemplateChange = (e: any) => {
    const tempId = e.target.value;
    setSelectedTemplateId(tempId);
    
    if (tempId === "plain") {
      setSubject("");
      setBody("");
      return;
    }

    const template = templates.find((t: any) => t.id === tempId);
    if (template) {
      let populatedBody = template.body;
      if (customer) {
        populatedBody = populatedBody.replace(/\{\{CustomerName\}\}/g, customer.name);
        populatedBody = populatedBody.replace(/\{\{CompanyName\}\}/g, customer.company || "");
      }
      setSubject(template.subject || "");
      setBody(populatedBody);
    }
  };

  const draftWithAI = async (tone: string) => {
    if (!aiPrompt) return alert("Please type an instruction first!");
    setIsDrafting(true);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, tone })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      let newBody = data.html;
      if (customer) {
         newBody = newBody.replace(/\{\{CustomerName\}\}/g, customer.name);
      }
      setBody(newBody);
    } catch (err: any) {
      alert("AI Error: " + err.message);
    }
    setIsDrafting(false);
  };

  const handleWhatsApp = () => {
    if (!customer?.phone) return alert("This customer has no phone number!");
    const phone = customer.phone.replace(/\D/g, "");
    const text = encodeURIComponent(body);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--surface-border)',
      padding: '24px', borderRadius: '12px', marginBottom: '24px'
    }}>
      <h2 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '18px'}}>
        <Send size={20} /> Compose Message
      </h2>
      
      <form action={async (formData) => {
        setIsSending(true);
        try {
          await sendComposedEmail(formData);
          setSubject("");
          setBody("");
          alert("Email Sent!");
        } catch(e: any) {
          alert("Error sending: " + e.message);
        }
        setIsSending(false);
      }}>
        <div style={{display: 'grid', gap: '16px'}}>
          <div>
            <label style={{display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase'}}>To *</label>
            <select name="customerId" required value={selectedCustomerId} onChange={(e) => {
              setSelectedCustomerId(e.target.value);
              // Trigger template reload to replace variables with new customer name
              if (selectedTemplateId) handleTemplateChange({ target: { value: selectedTemplateId }});
            }} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '14px', fontFamily: 'var(--font-sans)'}}>
              <option value="">-- Select Customer --</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email || c.phone})</option>
              ))}
            </select>
            <input type="hidden" name="toEmail" value={customer?.email || ""} />
          </div>

          <div>
            <label style={{display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase'}}>Template</label>
            <select value={selectedTemplateId} onChange={handleTemplateChange} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '14px', fontFamily: 'var(--font-sans)'}}>
              <option value="plain">Plain Message</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>

          {!isWhatsApp && (
            <div>
              <label style={{display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase'}}>Subject *</label>
              <input type="text" name="subject" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Your Quotation from Technext"
                style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '14px'}} />
            </div>
          )}

          <div style={{background: '#F3F4F6', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px'}}>
              <Sparkles size={14} color="#8B5CF6" /> Draft with AI
            </label>
            <div style={{display: 'flex', gap: '8px'}}>
              <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="E.g., Write a polite reminder for pending payment..."
                style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px'}} />
              <button type="button" onClick={() => draftWithAI("professional")} disabled={isDrafting} style={{background: '#8B5CF6', color: 'white', border: 'none', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500}}>
                {isDrafting ? "Drafting..." : "Draft"}
              </button>
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase'}}>Attachment (Optional)</label>
            <input type="file" name="attachment" accept="application/pdf,image/*" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '14px', background: 'var(--surface-background)'}} />
          </div>

          <div>
            <label style={{display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase'}}>Message Body</label>
            <textarea name="body" rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message here..."
              style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '14px', fontFamily: 'var(--font-sans)', resize: 'vertical'}} />
          </div>

          {isWhatsApp ? (
             <button type="button" onClick={handleWhatsApp} className="btn-primary" style={{width: '100%', padding: '12px', background: '#25D366', borderColor: '#25D366'}}>
               <Phone size={16} /> Open in WhatsApp
             </button>
          ) : (
            <button type="submit" className="btn-primary" style={{width: '100%', padding: '12px'}} disabled={!isConfigured || isSending}>
              <Mail size={16} /> {isSending ? 'Sending...' : (isConfigured ? 'Send Email via CRM' : 'Configure Gmail First')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
