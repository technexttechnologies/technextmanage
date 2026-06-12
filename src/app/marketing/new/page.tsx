"use client";

import { useState } from "react";
import { launchCampaign } from "../actions";
import Link from "next/link";
import { ArrowLeft, Send, Info, Sparkles } from "lucide-react";
import styles from "./page.module.css";

export default function NewCampaignPage() {
  const [body, setBody] = useState("");
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/marketing" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Create Marketing Campaign</h1>
      </header>

      <form action={launchCampaign} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Campaign Details</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="name">Campaign Name *</label>
            <input type="text" id="name" name="name" required placeholder="e.g. Diwali Special Offer" autoComplete="off" />
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="subject">Email Subject *</label>
              <input type="text" id="subject" name="subject" required placeholder="Subject line for your email" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="audience">Target Audience *</label>
              <select id="audience" name="audience" required>
                <option value="ALL">All Customers</option>
                <option value="ACTIVE">Active Customers</option>
                <option value="RENEWAL_DUE">Renewal Due Customers</option>
                <option value="LEAD">Leads & Prospects</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Email Content</h2>
          
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
              <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="E.g., Write a promotional email for 20% off web hosting..."
                style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px'}} />
              <button type="button" onClick={() => draftWithAI("professional")} disabled={isDrafting} style={{background: '#8B5CF6', color: 'white', border: 'none', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500}}>
                {isDrafting ? "Drafting..." : "Draft"}
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="body">Email Body (HTML or Text) *</label>
            <textarea 
              id="body" 
              name="body" 
              required 
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="<p>Dear {{name}},</p><p>We have a special offer for {{company}}...</p>" 
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/marketing" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">
            <Send size={18} />
            Launch Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
