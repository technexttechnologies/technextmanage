export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Folder, HardDrive, FileText, Calendar, Download } from "lucide-react";
import styles from "./page.module.css";
import ErpDocumentUploader from "./ErpDocumentUploader";
import { deleteErpDocument } from "./actions";

export default async function ErpDocumentsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS", "OPERATIONS", "HR"].includes(session.role)) {
    redirect("/");
  }

  const documents = await prisma.erpDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}><Folder size={32} color="#8B5CF6" /> Company Documents</h1>
          <p className={styles.subtitle}>Secure internal document storage for the company.</p>
        </div>
      </header>

      <ErpDocumentUploader />

      <div className={styles.card}>
        {documents.length === 0 ? (
          <div className={styles.emptyState}>
            <HardDrive size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3>No Documents Uploaded</h3>
            <p>Upload company agreements, tax documents, or licenses here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Folder</th>
                  <th>Version</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileIcon}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className={styles.fileName}>
                            {doc.name}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.tag}>{doc.folder}</span></td>
                    <td>v{doc.version}</td>
                    <td>{doc.uploadedBy.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <Calendar size={14} />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '6px 12px' }}>
                          <Download size={14} /> Download
                        </a>
                        <form action={deleteErpDocument} className={styles.deleteForm}>
                          <input type="hidden" name="documentId" value={doc.id} />
                          <button type="submit" className="btn-danger" style={{ padding: '6px 12px', background: 'transparent', color: '#EF4444', border: '1px solid #EF4444' }}>Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
