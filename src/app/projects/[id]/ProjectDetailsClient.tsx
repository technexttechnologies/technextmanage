"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Copy, ExternalLink, Pin, Trash2, CheckCircle, Star, Send, CheckCircle2, Receipt, Plus, FileText } from "lucide-react";
import styles from "./page.module.css";
import { 
  updateProjectStatus, 
  addProjectNote, 
  deleteProjectNote, 
  togglePinNote, 
  createMilestone, 
  completeMilestone, 
  updateProjectWarranty, 
  deleteProject,
  dispatchProjectWhatsAppUpdate,
  dispatchProjectWhatsAppReview
} from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { getWhatsAppLink } from "@/lib/whatsapp";

export default function ProjectDetailsClient({ project }: { project: any }) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSendingWA, startSendingWA] = useTransition();
  const [waNotice, setWaNotice] = useState<string | null>(null);

  const handleSendWAUpdate = () => {
    startSendingWA(async () => {
      try {
        const res = await dispatchProjectWhatsAppUpdate(project.id);
        setWaNotice("WhatsApp progress update sent / logged successfully!");
        if (res.waLink && res.result?.status === "SIMULATED") {
          window.open(res.waLink, "_blank");
        }
        setTimeout(() => setWaNotice(null), 4000);
      } catch (err: any) {
        setWaNotice(err.message || "Failed to dispatch WhatsApp update");
      }
    });
  };

  const handleSendWAReview = () => {
    startSendingWA(async () => {
      try {
        const res = await dispatchProjectWhatsAppReview(project.id);
        setWaNotice("Google review invitation sent / logged on WhatsApp!");
        if (res.waLink && res.result?.status === "SIMULATED") {
          window.open(res.waLink, "_blank");
        }
        setTimeout(() => setWaNotice(null), 4000);
      } catch (err: any) {
        setWaNotice(err.message || "Failed to dispatch review request");
      }
    });
  };

  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const trackingLink = `https://technextmanage.vercel.app/track/${project.id}`;

  const messageTemplate = `Hello ${project.customer?.name || 'Customer'},

Here is an update on your project: *${project.name}*

*Status:* ${formatStatus(project.status)}
*Progress:* ${project.progress}%

You can track your project's live status anytime using your secure link:
${trackingLink}

Best regards,
technext`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const openWhatsApp = () => {
    const url = getWhatsAppLink(project.customer?.phone, messageTemplate);
    window.open(url, "_blank");
  };

  return (
    <div className={styles.grid}>
      {/* LEFT COLUMN */}
      <div>
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>Project Status Workflow</h2>
          <form action={async (formData) => {
            await updateProjectStatus(project.id, formData.get("status") as string, parseInt(formData.get("progress") as string));
          }}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Current Status</label>
                <select name="status" defaultValue={project.status}>
                  <optgroup label="Development / General">
                    <option value="PROJECT_RECEIVED">Project Received</option>
                    <option value="REQUIREMENT_ANALYSIS">Requirement Analysis</option>
                    <option value="PLANNING">Planning</option>
                    <option value="UI_UX_DESIGN">UI/UX Design</option>
                    <option value="DEVELOPMENT">Development</option>
                    <option value="TESTING">Testing</option>
                    <option value="CLIENT_REVIEW">Client Review</option>
                    <option value="REVISION">Revision</option>
                    <option value="DEPLOYMENT">Deployment</option>
                  </optgroup>
                  <optgroup label="Software Reselling / Setup">
                    <option value="INSTALLATION">Installation</option>
                    <option value="DATA_MIGRATION">Data Migration</option>
                    <option value="CUSTOMER_TRAINING">Customer Training</option>
                    <option value="GO_LIVE">Go Live</option>
                  </optgroup>
                  <optgroup label="Final Stages">
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </optgroup>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Progress (%)</label>
                <input type="number" name="progress" min="0" max="100" defaultValue={project.progress} />
              </div>
            </div>
            <div style={{display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center'}}>
              <SubmitButton className="btn-primary" loadingText="Updating & Notifying...">Update Status & Notify Client</SubmitButton>
              <button 
                type="button"
                onClick={async () => {
                  if (confirm('Are you absolutely sure you want to permanently delete this project? This action cannot be undone.')) {
                    await deleteProject(project.id);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  backgroundColor: '#FEF2F2',
                  color: '#EF4444',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <Trash2 size={16} /> Delete Project
              </button>
            </div>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeader}>Warranty & AMC Tracking</h2>
          <div style={{marginBottom: '16px'}}>
            <p style={{marginBottom: '8px'}}>
              <strong>Warranty Status: </strong>
              {project.warrantyEndDate ? (
                new Date(project.warrantyEndDate) >= new Date() ? (
                  <span style={{color: '#10B981', fontWeight: 'bold'}}>Active (Ends {new Date(project.warrantyEndDate).toLocaleDateString()})</span>
                ) : (
                  <span style={{color: '#EF4444', fontWeight: 'bold'}}>Expired (Ended {new Date(project.warrantyEndDate).toLocaleDateString()})</span>
                )
              ) : (
                <span style={{color: '#6B7280'}}>Not Set</span>
              )}
            </p>
            <p style={{marginBottom: '8px'}}>
              <strong>Free Updates Status: </strong>
              {project.freeUpdatesEndDate ? (
                new Date(project.freeUpdatesEndDate) >= new Date() ? (
                  <span style={{color: '#10B981', fontWeight: 'bold'}}>Active (Ends {new Date(project.freeUpdatesEndDate).toLocaleDateString()})</span>
                ) : (
                  <span style={{color: '#EF4444', fontWeight: 'bold'}}>Expired (Ended {new Date(project.freeUpdatesEndDate).toLocaleDateString()})</span>
                )
              ) : (
                <span style={{color: '#6B7280'}}>Not Set</span>
              )}
            </p>
            <p>
              <strong>AMC ID: </strong>
              {project.amcId ? (
                <span style={{fontWeight: 'bold', color: '#2563EB'}}>{project.amcId}</span>
              ) : (
                <span style={{color: '#6B7280'}}>Not Set</span>
              )}
            </p>
          </div>
          <form action={async (formData) => {
            await updateProjectWarranty(project.id, formData);
          }}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Warranty End Date</label>
                <input type="date" name="warrantyEndDate" defaultValue={project.warrantyEndDate ? new Date(project.warrantyEndDate).toISOString().split('T')[0] : ""} />
              </div>
              <div className={styles.formGroup}>
                <label>Free Updates End Date</label>
                <input type="date" name="freeUpdatesEndDate" defaultValue={project.freeUpdatesEndDate ? new Date(project.freeUpdatesEndDate).toISOString().split('T')[0] : ""} />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>AMC ID</label>
                <input type="text" name="amcId" defaultValue={project.amcId || ""} placeholder="E.g., AMC-2023-001" />
              </div>
            </div>
            <button type="submit" className="btn-secondary" style={{marginTop: '12px'}}>Update Support Details</button>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeader}>Hardware & Asset Tracking</h2>
          <div style={{marginBottom: '20px'}}>
            {project.hardware && project.hardware.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {project.hardware.map((hw: any) => (
                  <div key={hw.id} style={{padding: '12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', background: '#F8FAFC'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div>
                        <strong style={{fontSize: '14px', color: '#0F172A'}}>{hw.itemName}</strong>
                        {hw.serialNo && <div style={{fontSize: '13px', color: '#475569', marginTop: '2px'}}>S/N: {hw.serialNo}</div>}
                        {hw.warrantyEnd && (
                          <div style={{fontSize: '13px', color: new Date(hw.warrantyEnd) >= new Date() ? '#10B981' : '#EF4444', marginTop: '2px', fontWeight: '500'}}>
                            Warranty: {new Date(hw.warrantyEnd).toLocaleDateString()}
                          </div>
                        )}
                        {hw.notes && <div style={{fontSize: '12px', color: '#64748B', marginTop: '4px'}}>{hw.notes}</div>}
                      </div>
                      <button onClick={async () => {
                        if(confirm('Delete this hardware asset?')) {
                          await import('../actions').then(m => m.deleteProjectHardware(hw.id, project.id));
                        }
                      }} style={{color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer'}}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{fontSize: '14px', color: '#6B7280'}}>No hardware assigned to this project.</p>
            )}
          </div>

          <form action={async (formData) => {
            await import('../actions').then(m => m.addProjectHardware(formData));
            // @ts-ignore
            document.getElementById('hardwareForm')?.reset();
          }} id="hardwareForm">
            <input type="hidden" name="projectId" value={project.id} />
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Item Name *</label>
                <input type="text" name="itemName" placeholder="Thermal Printer..." required />
              </div>
              <div className={styles.formGroup}>
                <label>Serial Number</label>
                <input type="text" name="serialNo" placeholder="S/N..." />
              </div>
              <div className={styles.formGroup}>
                <label>Warranty End Date</label>
                <input type="date" name="warrantyEnd" />
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <input type="text" name="notes" placeholder="Brand, Model, etc." />
              </div>
            </div>
            <button type="submit" className="btn-secondary" style={{marginTop: '12px'}}>Add Hardware</button>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeader}>Project Milestones</h2>
          
          <div style={{marginBottom: '20px'}}>
            {project.milestones?.map((m: any) => (
              <div key={m.id} className={`${styles.milestoneItem} ${m.isCompleted ? styles.milestoneCompleted : ''}`}>
                <div>
                  <div className={styles.milestoneTitle}>{m.title}</div>
                  <div className={styles.milestoneDate}>Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                {!m.isCompleted ? (
                  <button onClick={() => completeMilestone(m.id, project.id)} className="btn-primary" style={{padding: '6px 12px', fontSize: '12px'}}>
                    <CheckCircle size={14} style={{marginRight: '4px'}}/> Complete
                  </button>
                ) : (
                  <span style={{color: '#10B981', fontWeight: 'bold', fontSize: '12px'}}>COMPLETED</span>
                )}
              </div>
            ))}
          </div>

          <form action={createMilestone} className={styles.formGrid}>
            <input type="hidden" name="projectId" value={project.id} />
            <div className={styles.formGroup}>
              <input type="text" name="title" placeholder="New Milestone Title..." required />
            </div>
            <div className={styles.formGroup} style={{flexDirection: 'row', gap: '8px'}}>
              <input type="date" name="dueDate" style={{flex: 1}} />
              <button type="submit" className="btn-secondary">Add</button>
            </div>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeader}>Internal Notes</h2>
          <div style={{marginBottom: '16px'}}>
            {project.notes?.map((note: any) => (
              <div key={note.id} className={styles.noteItem} style={note.isPinned ? {borderLeftColor: '#EF4444'} : {}}>
                <div>
                  {note.isPinned && <Pin size={12} color="#EF4444" style={{marginRight: '4px'}} />}
                  {note.content}
                </div>
                <div className={styles.noteActions}>
                  <button onClick={() => togglePinNote(note.id, !note.isPinned, project.id)}>
                    <Pin size={16} color={note.isPinned ? "#EF4444" : "#9CA3AF"} />
                  </button>
                  <button onClick={() => deleteProjectNote(note.id, project.id)}>
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form action={addProjectNote}>
            <input type="hidden" name="projectId" value={project.id} />
            <div className={styles.formGroup}>
              <textarea name="content" rows={3} placeholder="Type a note..." required></textarea>
            </div>
            <button type="submit" className="btn-secondary" style={{marginTop: '8px'}}>Save Note</button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div>
        <div className={styles.whatsappCard}>
          <h3><MessageCircle size={20} /> WhatsApp Automation & Sharing</h3>
          <p>Instantly notify the customer with an automated formatted status report, live tracking link, or request a 5-star Google review.</p>
          
          {waNotice && (
            <div style={{
              background: '#DCFCE7',
              color: '#166534',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={15} />
              {waNotice}
            </div>
          )}

          <div className={styles.whatsappActions}>
            <button 
              type="button" 
              onClick={handleSendWAUpdate} 
              disabled={isSendingWA} 
              className={styles.whatsappBtn}
            >
              <Send size={15} /> {isSendingWA ? "Sending..." : "Send Progress Update"}
            </button>
            <button 
              type="button" 
              onClick={handleSendWAReview} 
              disabled={isSendingWA} 
              className={styles.secondaryBtn}
              style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}
            >
              <Star size={15} color="#D97706" /> Request Google Review
            </button>
            <button type="button" onClick={openWhatsApp} className={styles.secondaryBtn}>
              <ExternalLink size={15} /> Open in WhatsApp Web
            </button>
            <button type="button" onClick={copyToClipboard} className={styles.secondaryBtn}>
              <Copy size={15} /> {copied ? "Copied!" : "Copy Message"}
            </button>
            <button type="button" onClick={copyLink} className={styles.secondaryBtn}>
              <Copy size={15} /> {linkCopied ? "Link Copied!" : "Copy Tracking Link"}
            </button>
          </div>
        </div>

        {/* Project Invoices & Billing Suite Card */}
        <div className={styles.card} style={{ borderLeft: '4px solid #00a2ed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="#00a2ed" />
              <h2 className={styles.cardHeader} style={{ margin: 0 }}>Project Invoices &amp; Billing</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link 
                href={`/billing/new?type=invoice&customerId=${project.customerId || ''}&projectId=${project.id}`}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
              >
                <Plus size={13} /> Bill Project
              </Link>
              <Link 
                href={`/billing/new?type=quotation&customerId=${project.customerId || ''}&projectId=${project.id}`}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
              >
                <FileText size={13} /> Quote
              </Link>
            </div>
          </div>

          {/* Project Financial Summary */}
          {project.invoiceRequests && project.invoiceRequests.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', padding: '10px', background: '#F8FAFC', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Total Invoiced</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>
                    ₹{project.invoiceRequests.reduce((sum: number, inv: any) => sum + (inv.amountRequested || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Total Collected</span>
                  <strong style={{ fontSize: '14px', color: '#166534' }}>
                    ₹{project.invoiceRequests.reduce((sum: number, inv: any) => {
                      const sData = (inv.structuredData as any) || {};
                      const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
                      return sum + (isPaid ? (sData.paidAmount || inv.amountRequested) : 0);
                    }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Balance Due</span>
                  <strong style={{ fontSize: '14px', color: '#DC2626' }}>
                    ₹{Math.max(0, 
                      project.invoiceRequests.reduce((sum: number, inv: any) => sum + (inv.amountRequested || 0), 0) -
                      project.invoiceRequests.reduce((sum: number, inv: any) => {
                        const sData = (inv.structuredData as any) || {};
                        const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
                        return sum + (isPaid ? (sData.paidAmount || inv.amountRequested) : 0);
                      }, 0)
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Invoices List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.invoiceRequests.map((inv: any) => {
                  const sData = (inv.structuredData as any) || {};
                  const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
                  const docNum = sData.documentNumber || inv.aroniumInvoiceNo || `26-200-${inv.id.slice(-6).toUpperCase()}`;
                  return (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                      <div>
                        <Link href={`/billing/doc/invoice/${inv.id}`} style={{ fontWeight: 700, color: '#00a2ed', textDecoration: 'none' }}>
                          #{docNum}
                        </Link>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {new Date(sData.date || inv.createdAt).toLocaleDateString()} • {inv.notes || "Professional Tech Services"}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700 }}>₹{inv.amountRequested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: isPaid ? '#DCFCE7' : '#FEF3C7',
                          color: isPaid ? '#166534' : '#92400E'
                        }}>
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                        <Link href={`/billing/doc/invoice/${inv.id}`} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              No billing documents linked yet. Click &quot;Bill Project&quot; above to create an official invoice bill for this project.
            </p>
          )}
        </div>

        {(project.licenseKey || project.softwareVersion || project.machineId) && (
          <div className={styles.card} style={{ borderLeft: '4px solid #3B82F6' }}>
            <h2 className={styles.cardHeader}>Software License Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              {project.softwareVersion && <div><strong>Software:</strong> {project.softwareVersion}</div>}
              {project.licenseKey && <div><strong>License Key:</strong> <code style={{background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px'}}>{project.licenseKey}</code></div>}
              {project.licenseType && <div><strong>Type:</strong> {project.licenseType}</div>}
              {project.machineId && <div><strong>Machine ID:</strong> {project.machineId}</div>}
            </div>
          </div>
        )}

        <div className={styles.card}>
          <h2 className={styles.cardHeader}>Activity Timeline</h2>
          <div className={styles.timeline}>
            {project.activityLogs?.length > 0 ? project.activityLogs.map((log: any) => (
              <div key={log.id} className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <CheckCircle size={16} />
                </div>
                <div className={styles.timelineContent}>
                  <strong>{log.action}</strong>
                  <div className={styles.timelineDate}>{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )) : (
              <p style={{fontSize: '14px', color: '#6B7280'}}>No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
