export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, FileText, CheckCircle, Save, Phone, Mail, Building, Activity } from "lucide-react";
import styles from "./page.module.css";
import { updateLeadStatus, saveLeadNotes, updateLeadDetails, convertToCustomer } from "./actions";

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
    include: { assignedTo: true }
  });

  if (!lead) return notFound();

  const statuses = ["NEW", "CONTACTED", "QUALIFIED", "FOLLOW_UP", "LOST"];

  return (
    <div className={styles.container}>
      <Link href="/leads" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Leads
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{lead.name}</h1>
          <span className={styles.sourceTag}>Source: {lead.source}</span>
        </div>
        {lead.status === "CONVERTED" && (
          <div style={{background: '#DCFCE7', color: '#16A34A', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <CheckCircle size={20} /> Converted to Customer
          </div>
        )}
      </header>

      <div className={styles.grid}>
        {/* Left Column: Details & Notes */}
        <div>
          <div className={styles.card}>
            <h2 className={styles.cardHeader}><User size={20} /> Lead Details</h2>
            <form action={updateLeadDetails}>
              <input type="hidden" name="leadId" value={lead.id} />
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input type="text" name="name" defaultValue={lead.name} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Company</label>
                  <input type="text" name="company" defaultValue={lead.company || ""} />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input type="text" name="phone" defaultValue={lead.phone || ""} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input type="email" name="email" defaultValue={lead.email || ""} />
                </div>
              </div>
              <button type="submit" className="btn-secondary" style={{marginTop: '16px'}}>
                <Save size={16} /> Save Changes
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}><FileText size={20} /> Internal Notes & Activity</h2>
            <form action={saveLeadNotes}>
              <input type="hidden" name="leadId" value={lead.id} />
              <div className={styles.formGroup}>
                <textarea 
                  name="notes" 
                  rows={6} 
                  defaultValue={lead.notes || ""} 
                  placeholder="Log calls, meeting notes, or requirements here..."
                />
              </div>
              <button type="submit" className="btn-secondary" style={{marginTop: '16px'}}>
                <Save size={16} /> Update Notes
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Status & Conversion */}
        <div>
          {lead.status !== "CONVERTED" && (
            <div className={styles.card}>
              <h2 className={styles.cardHeader}><Activity size={20} /> Lead Status</h2>
              <div className={styles.statusContainer}>
                {statuses.map(s => (
                  <form key={s} action={async () => {
                    "use server";
                    await updateLeadStatus(lead.id, s);
                  }}>
                    <button 
                      type="submit" 
                      className={`${styles.statusBtn} ${lead.status === s ? styles.active : ''}`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
            <div className={`${styles.card} ${styles.convertCard}`}>
              <h3>Win the Deal! 🎯</h3>
              <p>Ready to move forward? Convert this lead into a Customer. This will push the customer to the CRM and the Aronium POS database.</p>
              <form action={async () => {
                "use server";
                await convertToCustomer(lead.id);
              }}>
                <button type="submit" className={styles.convertBtn}>
                  <CheckCircle size={20} /> Convert to Customer
                </button>
              </form>
            </div>
          )}

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>Quick Actions</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="btn-secondary" style={{justifyContent: 'center'}}>
                  <Phone size={18} /> Call {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="btn-secondary" style={{justifyContent: 'center'}}>
                  <Mail size={18} /> Email {lead.email}
                </a>
              )}
              {!lead.phone && !lead.email && (
                <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>No contact information available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
