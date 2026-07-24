
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createVendor } from "../actions";
import styles from "../page.module.css";

export default async function NewVendorPage() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Add New Vendor</h1>
          <p className={styles.subtitle}>Create a new vendor profile in the ERP system.</p>
        </div>
      </div>

      <div className={styles.formContainer}>
        <form action={createVendor}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Company Name *</label>
            <input name="companyName" required className={styles.input} placeholder="Acme Corp" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contact Person</label>
            <input name="contactPerson" className={styles.input} placeholder="John Doe" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input type="email" name="email" className={styles.input} placeholder="john@acme.com" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input name="phone" className={styles.input} placeholder="+91 9876543210" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>GST Number</label>
            <input name="gstNumber" className={styles.input} placeholder="27XXXXX1234X1ZX" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <textarea name="address" className={styles.textarea} placeholder="Full address details" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Services Provided</label>
            <textarea name="services" className={styles.textarea} placeholder="IT Support, Hardware, etc." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Payment Terms</label>
            <input name="paymentTerms" className={styles.input} placeholder="Net 30, Advance, etc." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Outstanding Balance (₹)</label>
            <input type="number" step="0.01" name="outstandingBal" className={styles.input} defaultValue="0" />
          </div>

          <div style={{ marginTop: "2rem" }}>
            <Link href="/erp/vendors" className={styles.cancelBtn}>Cancel</Link>
            <button type="submit" className={styles.submitBtn}>Save Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}
