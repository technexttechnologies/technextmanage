import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Phone, Mail, Building2, UserCircle } from "lucide-react";
import styles from "./page.module.css";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>Manage your clients and prospects.</p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          <Plus size={20} />
          <span className={styles.hideMobile}>Add Customer</span>
        </Link>
      </header>

      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search customers..." 
          className={styles.searchInput}
        />
      </div>

      {customers.length === 0 ? (
        <div className={styles.emptyState}>
          <UserCircle size={48} className={styles.emptyIcon} />
          <h2>No customers yet</h2>
          <p>Get started by adding your first customer.</p>
          <Link href="/customers/new" className="btn-primary" style={{marginTop: '16px'}}>
            Add Customer
          </Link>
        </div>
      ) : (
        <div className={styles.customerList}>
          {customers.map(customer => (
            <div key={customer.id} className={styles.customerCard}>
              <Link href={`/customers/${customer.id}`} className={styles.cardHeaderLink}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.cardInfo}>
                    <h3>{customer.name}</h3>
                    {customer.company && (
                      <p className={styles.company}>
                        <Building2 size={14} /> {customer.company}
                      </p>
                    )}
                  </div>
                  <span className={`${styles.statusBadge} ${styles[customer.status.toLowerCase()] || styles.default}`}>
                    {customer.status}
                  </span>
                </div>
              </Link>
              
              <div className={styles.cardActions}>
                <a href={`tel:${customer.phone}`} className={styles.actionBtn}>
                  <Phone size={18} /> Call
                </a>
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className={styles.actionBtn}>
                    <Mail size={18} /> Email
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
