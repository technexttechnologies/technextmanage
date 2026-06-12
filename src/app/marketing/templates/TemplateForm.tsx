"use client";

import { useState } from "react";
import { saveTemplate, deleteTemplate } from "./actions";
import Link from "next/link";
import { Save, Info, Trash2, Sparkles } from "lucide-react";
import styles from "../new/page.module.css";

type Template = {
  id?: string;
  name: string;
  type: string;
  subject?: string | null;
  body: string;
};

export default function TemplateForm({ template }: { template?: Template }) {
  const [type, setType] = useState(template?.type || "EMAIL");
  const [isDeleting, setIsDeleting] = useState(false);
  const [body, setBody] = useState(template?.body || "");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

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
      setBody(data.html);
    } catch (err: any) {
      alert("AI Error: " + err.message);
    }
    setIsDrafting(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this template?")) {
      setIsDeleting(true);
      await deleteTemplate(template!.id!);
    }
  };

  return (
    <form action={saveTemplate} className={styles.formCard}>
      {template?.id && <input type="hidden" name="id" value={template.id} />}
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Template Details</h2>
        
        <div className={styles.inputGroup}>
          <label htmlFor="name">Template Name *</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            defaultValue={template?.name} 
            placeholder="e.g. Welcome Email" 
            autoComplete="off" 
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label htmlFor="type">Template Type *</label>
            <select 
              id="type" 
              name="type" 
              required 
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
          
          {type === "EMAIL" && (
            <div className={styles.inputGroup}>
              <label htmlFor="subject">Email Subject *</label>
              <input 
                type="text" 
                id="subject" 
                name="subject" 
                required 
                defaultValue={template?.subject || ""} 
                placeholder="Subject line for your email" 
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Message Content</h2>
        
        <div className={styles.tipBox}>
          <Info size={20} className={styles.tipIcon} />
          <div>
            <strong>Pro Tip:</strong> You can use <code>{"{{name}}"}</code> and <code>{"{{company}}"}</code> as dynamic variables in the body. They will be automatically replaced with the customer's actual details.
          </div>
        </div>

        <div style={{background: '#F3F4F6', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '16px'}}>
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

        <div className={styles.inputGroup}>
          <label htmlFor="body">Message Body *</label>
          <textarea 
            id="body" 
            name="body" 
            required 
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={type === "EMAIL" ? "<p>Dear {{name}},</p><p>We have a special offer for {{company}}...</p>" : "Hi {{name}}, here is your offer..."} 
          />
        </div>
      </div>

      <div className={styles.formActions} style={{ justifyContent: template?.id ? 'space-between' : 'flex-end' }}>
        {template?.id ? (
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
          >
            <Trash2 size={18} />
            {isDeleting ? "Deleting..." : "Delete Template"}
          </button>
        ) : <div />}
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/marketing/templates" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Save size={18} />
            Save Template
          </button>
        </div>
      </div>
    </form>
  );
}
