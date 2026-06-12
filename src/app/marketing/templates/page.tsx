export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Mail, MessageSquare } from "lucide-react";
import styles from "./page.module.css";

export default async function TemplatesPage() {
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Message Templates</h1>
          <p className={styles.subtitle}>Manage email and WhatsApp templates.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/marketing" className="btn-secondary">
            Back to Marketing
          </Link>
          <Link href="/marketing/templates/new" className="btn-primary">
            <Plus size={20} />
            <span className={styles.hideMobile}>New Template</span>
          </Link>
        </div>
      </header>

      {templates.length === 0 ? (
        <div className={styles.emptyState}>
          <MessageSquare size={48} className={styles.emptyIcon} />
          <h2>No templates yet</h2>
          <p>Get started by creating your first message template.</p>
          <Link href="/marketing/templates/new" className="btn-primary" style={{marginTop: '16px'}}>
            New Template
          </Link>
        </div>
      ) : (
        <div className={styles.templateList}>
          {templates.map(template => (
            <Link key={template.id} href={`/marketing/templates/${template.id}`} className={styles.templateCard}>
              <div className={styles.templateHeader}>
                <h3>{template.name}</h3>
                <span className={`${styles.typeBadge} ${styles[template.type] || ''}`}>
                  {template.type}
                </span>
              </div>
              
              {template.subject && (
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Subject: {template.subject}
                </div>
              )}
              
              <p className={styles.templateBody}>{template.body}</p>
              
              <div className={styles.templateFooter}>
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
