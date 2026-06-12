import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash } from "lucide-react";
import styles from "./page.module.css";
import { saveTemplate, deleteTemplate } from "./actions";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ id?: string }>}) {
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const resolvedParams = await searchParams;
  const activeTemplate = resolvedParams.id 
    ? templates.find(t => t.id === resolvedParams.id)
    : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/settings" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px'}}>
            <ArrowLeft size={16} /> Back to Settings
          </Link>
          <h1 className={styles.title}>Message Templates</h1>
        </div>
        <Link href="/settings/templates" className="btn-primary">
          <Plus size={18} /> New Template
        </Link>
      </header>

      <div className={styles.grid}>
        {/* List Column */}
        <div className={styles.listCard}>
          <h3 style={{marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)'}}>YOUR TEMPLATES</h3>
          {templates.map(t => (
            <Link 
              key={t.id} 
              href={`/settings/templates?id=${t.id}`}
              className={`${styles.templateItem} ${activeTemplate?.id === t.id ? styles.active : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span className={styles.templateName}>{t.name}</span>
              <span className={styles.typeTag}>{t.type}</span>
            </Link>
          ))}
          {templates.length === 0 && (
            <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>No templates saved.</p>
          )}
        </div>

        {/* Editor Column */}
        <div className={styles.editorCard}>
          <div className={styles.variablesBox}>
            <strong>Available Variables:</strong><br/>
            <code>{`{{CustomerName}}`}</code>
            <code>{`{{CompanyName}}`}</code>
            <code>{`{{ServiceName}}`}</code>
          </div>

          <form action={saveTemplate}>
            <input type="hidden" name="id" value={activeTemplate?.id || ""} />
            
            <div className={styles.formGroup}>
              <label>Template Name</label>
              <input type="text" name="name" className={styles.input} defaultValue={activeTemplate?.name || ""} required placeholder="e.g. Welcome Email" />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div className={styles.formGroup}>
                <label>Message Type</label>
                <select name="type" className={styles.select} defaultValue={activeTemplate?.type || "EMAIL"}>
                  <option value="EMAIL">Email (HTML allowed)</option>
                  <option value="WHATSAPP">WhatsApp (Text only)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Subject (Emails only)</label>
                <input type="text" name="subject" className={styles.input} defaultValue={activeTemplate?.subject || ""} placeholder="Subject Line" />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Message Body</label>
              <textarea 
                name="body" 
                className={styles.textarea} 
                rows={12} 
                defaultValue={activeTemplate?.body || ""} 
                required 
                placeholder="Write your message here... Use {{CustomerName}} to inject variables."
              />
            </div>

            <div className={styles.actions}>
              {activeTemplate ? (
                <button formAction={async () => {
                  "use server";
                  await deleteTemplate(activeTemplate.id);
                }} className={styles.deleteBtn}>
                  Delete Template
                </button>
              ) : <div></div>}
              
              <button type="submit" className="btn-primary">
                <Save size={18} /> {activeTemplate ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
