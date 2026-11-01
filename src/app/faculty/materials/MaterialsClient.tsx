"use client";

import { useState, useTransition } from "react";
import { BookOpen, Plus, Search, ExternalLink, X, Code, FileText, Presentation, Bookmark } from "lucide-react";
import styles from "../faculty-shared.module.css";
import { createStudyMaterial } from "../actions";

export default function MaterialsClient({
  materials,
  batches,
}: {
  materials: any[];
  batches: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.batch.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === "ALL" || m.batchId === batchFilter;
    const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;

    return matchesSearch && matchesBatch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CODE": return <Code size={16} color="#059669" />;
      case "SLIDES": return <Presentation size={16} color="#D97706" />;
      case "REFERENCE": return <Bookmark size={16} color="#2563EB" />;
      default: return <FileText size={16} color="#4F46E5" />;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            <BookOpen size={24} color="var(--brand-primary)" />
            Study Materials & Code Repositories
          </h1>
          <p className={styles.headerSubtitle}>
            Share lecture slides, GitHub repositories, PDF handbooks, and documentation links with students.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsAddMaterialOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Share Material
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search material titles or descriptions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          <option value="NOTES">Notes & Handouts</option>
          <option value="SLIDES">Lecture Slides</option>
          <option value="CODE">Code & GitHub Repos</option>
          <option value="REFERENCE">Reference Documentation</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="ALL">All Batches ({batches.length})</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
          ))}
        </select>
      </div>

      {/* Grid of Materials */}
      <div className={styles.grid}>
        {filteredMaterials.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No study materials shared</h3>
            <p>Click "Share Material" to upload or link your first learning resource.</p>
          </div>
        ) : (
          filteredMaterials.map((mat) => (
            <div key={mat.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getCategoryIcon(mat.category)}
                  <div>
                    <h3 className={styles.cardTitle}>{mat.title}</h3>
                    <p className={styles.cardSubtitle}>{mat.batch.name}</p>
                  </div>
                </div>

                <span className={`${styles.badge} ${styles.badgeUpcoming}`}>
                  {mat.category}
                </span>
              </div>

              {mat.description && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  {mat.description}
                </p>
              )}

              <div className={styles.cardFooter}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Shared on {new Date(mat.createdAt).toLocaleDateString()}
                </span>

                <a 
                  href={mat.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary"
                  style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  Access Link <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- SHARE MATERIAL MODAL --- */}
      {isAddMaterialOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddMaterialOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <BookOpen size={20} color="var(--brand-primary)" />
                Share Study Material
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsAddMaterialOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createStudyMaterial(formData);
                  setIsAddMaterialOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to share material");
                }
              });
            }}>
              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Resource Title *</label>
                  <input type="text" name="title" required placeholder="e.g. Next.js 16 App Router Cheatsheet" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Target Batch *</label>
                    <select name="batchId" required defaultValue={batches[0]?.id}>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Category *</label>
                    <select name="category" defaultValue="NOTES">
                      <option value="NOTES">Notes & Handouts</option>
                      <option value="SLIDES">Lecture Presentation Slides</option>
                      <option value="CODE">GitHub Repository / Code</option>
                      <option value="REFERENCE">Official Documentation / Reference</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>URL / File Link *</label>
                  <input type="url" name="fileUrl" required placeholder="https://github.com/... or https://drive.google.com/..." />
                </div>

                <div className={styles.inputGroup}>
                  <label>Description / Reading Instructions</label>
                  <textarea name="description" rows={3} placeholder="Brief guidance on what chapters or code files to review..."></textarea>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddMaterialOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Sharing..." : "Share with Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
