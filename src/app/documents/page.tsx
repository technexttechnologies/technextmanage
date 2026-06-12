export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { FileText, Download, Calendar, HardDrive } from "lucide-react";
import styles from "./page.module.css";
import DocumentUploader from "@/components/DocumentUploader";
import { DeleteButton } from "@/app/settings/DeleteButton";
import { deleteDocument } from "./actions";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Cloud Documents</h1>
          <p className={styles.subtitle}>Securely store and manage files via Vercel Blob.</p>
        </div>
      </header>

      <DocumentUploader />

      <div className={styles.card}>
        {documents.length === 0 ? (
          <div className={styles.emptyState}>
            <HardDrive size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3>No Documents Uploaded</h3>
            <p>Your cloud drive is currently empty. Upload files above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
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
                            {doc.fileName}
                          </a>
                          <div className={styles.fileMeta}>{doc.mimeType}</div>
                        </div>
                      </div>
                    </td>
                    <td>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
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
                          <Download size={14} /> View
                        </a>
                        <form action={deleteDocument} className={styles.deleteForm}>
                          <input type="hidden" name="documentId" value={doc.id} />
                          <DeleteButton />
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
