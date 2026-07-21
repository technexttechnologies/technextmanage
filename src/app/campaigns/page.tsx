export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Megaphone, Plus, Mail } from "lucide-react";
import styles from "./page.module.css";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    redirect("/");
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { sentAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Megaphone size={32} color="var(--brand-primary)" />
            Email Campaigns
          </h1>
          <p className={styles.subtitle}>Broadcast newsletters and updates to your customers.</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Campaign
        </Link>
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardHeader}>
          <Mail size={20} /> Past Broadcasts
        </h2>

        {campaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <Megaphone size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3>No campaigns sent yet</h3>
            <p>Use the AI assistant to write and send your first newsletter.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Audience</th>
                <th>Sent To</th>
                <th>Sent Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(camp => (
                <tr key={camp.id}>
                  <td style={{ fontWeight: 500 }}>{camp.subject}</td>
                  <td>
                    <span className={styles.tag}>
                      {camp.audience.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{camp.sentCount} recipients</td>
                  <td>{new Date(camp.sentAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
