"use client";

import { useState } from "react";
import { MessageCircle, Copy, ExternalLink, Pin, Trash2, CheckCircle } from "lucide-react";
import styles from "./page.module.css";
import { updateProjectStatus, addProjectNote, deleteProjectNote, togglePinNote, createMilestone, completeMilestone, updateProjectWarranty } from "../actions";

export default function ProjectDetailsClient({ project }: { project: any }) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const trackingLink = `https://technextmanage.vercel.app/track/${project.id}`;

  const messageTemplate = `Hello ${project.customer?.name || 'Customer'},

Here is an update on your project: *${project.name}*

*Status:* ${formatStatus(project.status)}
*Progress:* ${project.progress}%

You can track your project's live status anytime using your secure link:
${trackingLink}

Best regards,
TechNext Technologies`;

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
    let phone = project.customer?.phone || "";
    phone = phone.replace(/\D/g, "");
    if (phone && !phone.startsWith("91") && phone.length === 10) phone = "91" + phone;
    
    const encodedMessage = encodeURIComponent(messageTemplate);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
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
                  <option value="PROJECT_RECEIVED">Project Received</option>
                  <option value="REQUIREMENT_ANALYSIS">Requirement Analysis</option>
                  <option value="PLANNING">Planning</option>
                  <option value="UI_UX_DESIGN">UI/UX Design</option>
                  <option value="DEVELOPMENT">Development</option>
                  <option value="TESTING">Testing</option>
                  <option value="CLIENT_REVIEW">Client Review</option>
                  <option value="REVISION">Revision</option>
                  <option value="DEPLOYMENT">Deployment</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Progress (%)</label>
                <input type="number" name="progress" min="0" max="100" defaultValue={project.progress} />
              </div>
            </div>
            <button type="submit" className="btn-primary">Update Status & Notify Client</button>
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
          <h3><MessageCircle size={20} /> Share via WhatsApp</h3>
          <p>The system will automatically generate a highly formatted, professional text template containing the tracking link.</p>
          <div className={styles.whatsappActions}>
            <button type="button" onClick={openWhatsApp} className={styles.whatsappBtn}>
              <ExternalLink size={16} /> Open WhatsApp Web
            </button>
            <button type="button" onClick={copyToClipboard} className={styles.secondaryBtn}>
              <Copy size={16} /> {copied ? "Copied!" : "Copy Message"}
            </button>
            <button type="button" onClick={copyLink} className={styles.secondaryBtn}>
              <Copy size={16} /> {linkCopied ? "Link Copied!" : "Copy Tracking Link"}
            </button>
          </div>
        </div>

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
