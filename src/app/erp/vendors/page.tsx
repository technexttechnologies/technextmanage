
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, Mail, Phone, MapPin, Receipt, IndianRupee } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }

  const vendors = await prisma.erpVendor.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendors</h1>
          <p className={styles.subtitle}>Manage ERP Vendors and suppliers.</p>
        </div>
        <Link href="/erp/vendors/new" className={styles.primaryBtn}>
          <Plus size={20} /> Add Vendor
        </Link>
      </div>

      <div className={styles.grid}>
        {vendors.map(vendor => (
          <div key={vendor.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.companyName}>{vendor.companyName}</h3>
                {vendor.contactPerson && <p className={styles.contactPerson}>{vendor.contactPerson}</p>}
              </div>
            </div>
            {vendor.email && (
              <div className={styles.infoRow}>
                <Mail className={styles.infoIcon} /> {vendor.email}
              </div>
            )}
            {vendor.phone && (
              <div className={styles.infoRow}>
                <Phone className={styles.infoIcon} /> {vendor.phone}
              </div>
            )}
            {vendor.address && (
              <div className={styles.infoRow}>
                <MapPin className={styles.infoIcon} /> {vendor.address}
              </div>
            )}
            <div className={styles.infoRow}>
              <Receipt className={styles.infoIcon} /> GST: {vendor.gstNumber || "N/A"}
            </div>
            <div className={styles.infoRow}>
              <IndianRupee className={styles.infoIcon} /> Balance: ₹{vendor.outstandingBal.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
