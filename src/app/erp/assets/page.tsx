
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Monitor, Calendar, IndianRupee, Tag, ShieldCheck, User } from "lucide-react";
import styles from "./page.module.css";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }

  const assets = await prisma.erpAsset.findMany({
    include: { assignedTo: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assets</h1>
          <p className={styles.subtitle}>Manage company hardware and software assets.</p>
        </div>
        <Link href="/erp/assets/new" className={styles.primaryBtn}>
          <Plus size={20} /> Add Asset
        </Link>
      </div>

      <div className={styles.grid}>
        {assets.map(asset => (
          <div key={asset.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.companyName}>{asset.name}</h3>
                <p className={styles.contactPerson}>{asset.assetId}</p>
              </div>
              <span className={`${styles.badge} ${styles[asset.status.toLowerCase()] || ""}`}>
                {asset.status}
              </span>
            </div>
            
            <div className={styles.infoRow}>
              <Tag className={styles.infoIcon} /> {asset.category}
            </div>
            <div className={styles.infoRow}>
              <Calendar className={styles.infoIcon} /> Purchased: {format(asset.purchaseDate, "PPP")}
            </div>
            <div className={styles.infoRow}>
              <IndianRupee className={styles.infoIcon} /> Cost: ₹{asset.purchaseCost.toFixed(2)}
            </div>
            {asset.warrantyEnd && (
              <div className={styles.infoRow}>
                <ShieldCheck className={styles.infoIcon} /> Warranty: {format(asset.warrantyEnd, "PPP")}
              </div>
            )}
            <div className={styles.infoRow}>
              <User className={styles.infoIcon} /> Assigned To: {asset.assignedTo?.name || "Unassigned"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
