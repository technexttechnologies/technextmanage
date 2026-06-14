import { prisma } from "@/lib/prisma";
import { createDomainRegistration } from "../actions";
import Link from "next/link";
import styles from "../page.module.css";

export default async function NewDomainPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New Domain Registration</h1>
          <p className={styles.subtitle}>Add a new domain for a customer.</p>
        </div>
      </header>

      <form action={createDomainRegistration} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Customer</label>
          <select name="customerId" required className={styles.select}>
            <option value="">Select Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Domain Name</label>
          <input type="text" name="domainName" required className={styles.input} placeholder="e.g. example.com" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Registrar</label>
          <input type="text" name="registrar" required className={styles.input} placeholder="e.g. GoDaddy, Namecheap" />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cost</label>
          <input type="number" step="0.01" name="domainCost" required className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Registration Date</label>
          <input type="date" name="registrationDate" required className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Expiry Date</label>
          <input type="date" name="expiryDate" required className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Auto Renewal</label>
          <select name="autoRenewalStatus" className={styles.select}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nameservers</label>
          <textarea name="nameservers" className={styles.textarea} placeholder="ns1.example.com&#10;ns2.example.com"></textarea>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>DNS Details</label>
          <textarea name="dnsDetails" className={styles.textarea} placeholder="A records, MX records..."></textarea>
        </div>

        <div className={styles.actions}>
          <Link href="/domains" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Save Domain</button>
        </div>
      </form>
    </div>
  );
}
