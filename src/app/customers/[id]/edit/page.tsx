import { prisma } from "@/lib/prisma";
import { updateCustomer } from "../../actions";
import Link from "next/link";
import styles from "../../new/page.module.css";
import { notFound } from "next/navigation";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id }
  });

  if (!customer) return notFound();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Customer</h1>
          <p className={styles.subtitle}>Update details for {customer.name}.</p>
        </div>
      </header>

      <form action={updateCustomer} className={styles.form}>
        <input type="hidden" name="id" value={customer.id} />
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input type="text" name="name" required className={styles.input} defaultValue={customer.name} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Company Name</label>
          <input type="text" name="company" className={styles.input} defaultValue={customer.company || ''} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Phone Number</label>
          <input type="tel" name="phone" required className={styles.input} defaultValue={customer.phone} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <input type="email" name="email" className={styles.input} defaultValue={customer.email || ''} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Status</label>
          <select name="status" className={styles.select} defaultValue={customer.status}>
            <option value="LEAD">Lead</option>
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active Client</option>
            <option value="PROJECT_RUNNING">Project Running</option>
            <option value="SUPPORT_REQUIRED">Support Required</option>
            <option value="RENEWAL_DUE">Renewal Due</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>GST Number</label>
          <input type="text" name="gstNumber" className={styles.input} defaultValue={customer.gstNumber || ''} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Address</label>
          <textarea name="address" className={styles.textarea} defaultValue={customer.address || ''}></textarea>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Internal Notes</label>
          <textarea name="notes" className={styles.textarea} defaultValue={customer.notes || ''}></textarea>
        </div>

        <div style={{ marginTop: '24px', marginBottom: '16px', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: '#0F172A' }}>Remote Support Credentials</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>AnyDesk ID</label>
            <input type="text" name="anydeskId" className={styles.input} defaultValue={customer.anydeskId || ''} placeholder="e.g. 123 456 789" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>TeamViewer ID / Pass</label>
            <input type="text" name="teamviewerId" className={styles.input} defaultValue={customer.teamviewerId || ''} placeholder="ID: xxxx / Pass: xxxx" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>PC Login Details</label>
            <textarea name="pcLoginDetails" className={styles.textarea} defaultValue={customer.pcLoginDetails || ''} placeholder="Any passwords or PINs for the PC"></textarea>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href={`/customers/${customer.id}`} className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Update Customer</button>
        </div>
      </form>
    </div>
  );
}
