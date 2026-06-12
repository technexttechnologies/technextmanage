"use client";

import { useState } from "react";
import { saveTemplate, deleteTemplate } from "./actions";
import Link from "next/link";
import { Save, Info, Trash2 } from "lucide-react";
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

        <div className={styles.inputGroup}>
          <label htmlFor="body">Message Body *</label>
          <textarea 
            id="body" 
            name="body" 
            required 
            defaultValue={template?.body}
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
