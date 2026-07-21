"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import styles from "../page.module.css";
import { generateCampaignContent, sendCampaign } from "../actions";

export default function CampaignClient() {
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [bodyContent, setBodyContent] = useState("");

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const result = await generateCampaignContent(aiPrompt);
      setBodyContent(result);
    } catch (err) {
      alert("Failed to generate content. Make sure Gemini API is configured in Settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bodyContent) {
      alert("Please generate or write the email body first.");
      return;
    }
    
    if (!confirm("Are you sure you want to broadcast this email? This cannot be undone.")) {
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("body", bodyContent);
      await sendCampaign(formData);
    } catch (err: any) {
      alert(err.message || "Failed to send campaign");
      setIsSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/campaigns" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', background: 'transparent', border: 'none' }}>
        <ArrowLeft size={16} /> Back to Campaigns
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New AI Campaign</h1>
          <p className={styles.subtitle}>Let AI draft your newsletter, review it, and blast it to your audience.</p>
        </div>
      </header>

      <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
        
        {/* AI Assistant Block */}
        <div className={styles.aiBox}>
          <div className={styles.aiHeader}>
            <Sparkles size={20} color="#8B5CF6" />
            AI Content Assistant
          </div>
          <textarea 
            className={styles.aiPrompt} 
            placeholder="E.g., Write a professional email announcing our new 20% discount on Software Maintenance renewals for the upcoming holiday..."
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={3}
          />
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleGenerate}
            disabled={isGenerating || !aiPrompt}
            style={{ background: '#8B5CF6', border: 'none' }}
          >
            {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Email Body</>}
          </button>
        </div>

        {/* Campaign Form */}
        <div className={styles.card}>
          <form onSubmit={handleSend}>
            <div className={styles.formGroup}>
              <label>Subject Line</label>
              <input type="text" name="subject" required placeholder="Enter a catchy subject line..." />
            </div>
            
            <div className={styles.formGroup}>
              <label>Target Audience</label>
              <select name="audience" required>
                <option value="ALL_CUSTOMERS">All Active Customers</option>
                <option value="ACTIVE_AMCS">Customers with Active AMCs</option>
                <option value="LEADS">Open Leads</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Email Body (HTML Supported)</label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                You can use placeholders like <strong>[Customer Name]</strong>. Review the AI generated text below before sending.
              </p>
              <textarea 
                className={styles.formGroup} 
                required 
                value={bodyContent}
                onChange={e => setBodyContent(e.target.value)}
                placeholder="The email content will appear here..."
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isSending || !bodyContent} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '16px', padding: '12px' }}>
              {isSending ? <><Loader2 size={20} className="animate-spin" /> Sending Broadcast...</> : <><Send size={20} /> Send Campaign Now</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
