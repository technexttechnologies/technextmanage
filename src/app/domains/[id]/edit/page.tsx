import { prisma } from "@/lib/prisma";
import { updateDomainRegistration } from "../../actions";
import Link from "next/link";
import styles from "../../page.module.css";
import { notFound } from "next/navigation";

export default async function EditDomainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const domain = await prisma.domainRegistration.findUnique({
    where: { id }
  });

  if (!domain) return notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Domain</h1>
          <p className={styles.subtitle}>Update details for {domain.domainName}.</p>
        </div>
      </header>

      <form action={updateDomainRegistration} className={styles.form}>
        <input type="hidden" name="id" value={domain.id} />
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Customer</label>
          <select name="customerId" required className={styles.select} defaultValue={domain.customerId}>
            <option value="">Select Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Domain Name</label>
          <input type="text" name="domainName" required className={styles.input} defaultValue={domain.domainName} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Registrar</label>
          <input type="text" name="registrar" required className={styles.input} defaultValue={domain.registrar} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cost</label>
          <input type="number" step="0.01" name="domainCost" required className={styles.input} defaultValue={domain.domainCost} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Registration Date</label>
          <input type="date" name="registrationDate" required className={styles.input} defaultValue={domain.registrationDate.toISOString().split('T')[0]} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Expiry Date</label>
          <input type="date" name="expiryDate" required className={styles.input} defaultValue={domain.expiryDate.toISOString().split('T')[0]} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Auto Renewal</label>
          <select name="autoRenewalStatus" className={styles.select} defaultValue={domain.autoRenewalStatus ? "true" : "false"}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nameservers</label>
          <textarea name="nameservers" className={styles.textarea} defaultValue={domain.nameservers || ''}></textarea>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>DNS Details</label>
          <textarea name="dnsDetails" className={styles.textarea} defaultValue={domain.dnsDetails || ''}></textarea>
        </div>

        <div className={styles.actions}>
          <Link href="/domains" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>Update Domain</button>
        </div>
      </form>
    </div>
  );
}
