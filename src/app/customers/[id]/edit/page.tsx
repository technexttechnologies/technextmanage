import { prisma } from "@/lib/prisma";
import { updateCustomer } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Save, Shield, KeyRound, Building, Phone, Mail, FileText, User } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import styles from "../../new/page.module.css";
import { notFound } from "next/navigation";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } }
    }
  });

  if (!customer) return notFound();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href={`/customers/${customer.id}`} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Profile</span>
        </Link>
        <h1 className={styles.title}>Edit Customer Details</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
          Update contact, identity, status, and credentials for <strong>{customer.name}</strong> (#{customer.customerNumber}).
        </p>
      </header>

      <form action={updateCustomer} className={styles.formCard}>
        <input type="hidden" name="id" value={customer.id} />

        {/* Section 1: Basic Identity & Contact */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Basic Information
          </h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Contact Person Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              defaultValue={customer.name} 
              placeholder="e.g. John Doe"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="company">Company / Business Name</label>
            <input 
              type="text" 
              id="company" 
              name="company" 
              defaultValue={customer.company || ""} 
              placeholder="e.g. Tech Solutions Inc."
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Phone Number *</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                required 
                defaultValue={customer.phone} 
                placeholder="e.g. +91 9876543210"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                defaultValue={customer.email || ""} 
                placeholder="e.g. john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Account Status & Tax Details */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Account & Compliance Details</h2>
          
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="status">Account Status</label>
              <select id="status" name="status" defaultValue={customer.status}>
                <option value="LEAD">Lead (Enquiry)</option>
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active Client</option>
                <option value="PROJECT_RUNNING">Project Running</option>
                <option value="SUPPORT_REQUIRED">Support Required</option>
                <option value="RENEWAL_DUE">Renewal Due</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="gstNumber">GST Number</label>
              <input 
                type="text" 
                id="gstNumber" 
                name="gstNumber" 
                defaultValue={customer.gstNumber || ""} 
                placeholder="e.g. 32AABCU9603R1ZM"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="address">Full Address / Location</label>
            <textarea 
              id="address" 
              name="address" 
              rows={2} 
              defaultValue={customer.address || ""} 
              placeholder="Street, City, State, PIN code..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="notes">Internal Notes & Remarks</label>
            <textarea 
              id="notes" 
              name="notes" 
              rows={3} 
              defaultValue={customer.notes || ""} 
              placeholder="Client background, key contact preferences, internal notes..."
            />
          </div>
        </div>

        {/* Section 3: Remote Support Credentials */}
        <div className={styles.formSection} style={{
          background: "linear-gradient(135deg, rgba(99, 91, 255, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)",
          border: "1px solid rgba(99, 91, 255, 0.2)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <KeyRound size={20} color="var(--brand-primary, #635bff)" />
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
              Remote Support & PC Credentials
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
            Stored securely for technical support and remote troubleshooting. Masked from unapproved sales representatives.
          </p>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="anydeskId">AnyDesk Address / ID</label>
              <input 
                type="text" 
                id="anydeskId" 
                name="anydeskId" 
                defaultValue={customer.anydeskId || ""} 
                placeholder="e.g. 123 456 789"
                style={{ fontFamily: "monospace" }}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="teamviewerId">TeamViewer ID & Password</label>
              <input 
                type="text" 
                id="teamviewerId" 
                name="teamviewerId" 
                defaultValue={customer.teamviewerId || ""} 
                placeholder="e.g. ID: 123456789 / Pass: abcd"
                style={{ fontFamily: "monospace" }}
              />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
            <label htmlFor="pcLoginDetails">System / PC Login Passwords or PIN</label>
            <textarea 
              id="pcLoginDetails" 
              name="pcLoginDetails" 
              rows={2} 
              defaultValue={customer.pcLoginDetails || ""} 
              placeholder="Computer username, PIN, Windows password, or server access notes..."
              style={{ fontFamily: "monospace", fontSize: "13.5px" }}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Link href={`/customers/${customer.id}`} className="btn-secondary">
            Cancel
          </Link>
          <SubmitButton icon={<Save size={18} />}>
            Save Changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
