
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, CreditCard, Calendar, IndianRupee, BellRing, Server } from "lucide-react";
import styles from "./page.module.css";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }

  const subscriptions = await prisma.erpSubscription.findMany({
    orderBy: { nextBillingDate: "asc" }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subscriptions</h1>
          <p className={styles.subtitle}>Manage software, hosting, and service subscriptions.</p>
        </div>
        <Link href="/erp/subscriptions/new" className={styles.primaryBtn}>
          <Plus size={20} /> Add Subscription
        </Link>
      </div>

      <div className={styles.grid}>
        {subscriptions.map(sub => (
          <div key={sub.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.companyName}>{sub.name}</h3>
                <p className={styles.contactPerson}>{sub.provider}</p>
              </div>
              <span className={`${styles.badge} ${styles.active}`}>
                {sub.billingCycle}
              </span>
            </div>
            
            <div className={styles.infoRow}>
              <IndianRupee className={styles.infoIcon} /> Cost: ₹{sub.cost.toFixed(2)}
            </div>
            <div className={styles.infoRow}>
              <Calendar className={styles.infoIcon} /> Next Billing: {format(sub.nextBillingDate, "PPP")}
            </div>
            {sub.reminderSent && (
              <div className={styles.infoRow}>
                <BellRing className={styles.infoIcon} /> Reminder Sent
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
