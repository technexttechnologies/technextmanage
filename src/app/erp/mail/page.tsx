import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Mail, Plus, Inbox, Send, Search } from "lucide-react";
import styles from "./page.module.css";

export default async function MailboxPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "HR", "OPERATIONS"].includes(session.role as string)) {
    redirect("/");
  }
  
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || "inbox";
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { email: true }
  });

  if (!user) redirect("/");

  const mails = await prisma.erpMail.findMany({
    where: currentTab === "sent" 
      ? { senderId: session.userId as string, status: "SENT" }
      : { recipient: user.email, status: "SENT" },
    include: {
      sender: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Mail className={styles.icon} />
          <h1>Internal Mail</h1>
        </div>
        <Link href="/erp/mail/compose" className={styles.btnPrimary}>
          <Plus size={18} /> Compose
        </Link>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link 
              href="/erp/mail?tab=inbox" 
              className={currentTab === "inbox" ? styles.activeNavLink : styles.navLink}
            >
              <Inbox size={18} /> Inbox
            </Link>
            <Link 
              href="/erp/mail?tab=sent" 
              className={currentTab === "sent" ? styles.activeNavLink : styles.navLink}
            >
              <Send size={18} /> Sent
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.mailList}>
            {mails.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No mails found in {currentTab}.</p>
              </div>
            ) : (
              mails.map(mail => (
                <div key={mail.id} className={styles.mailItem}>
                  <div className={styles.mailMeta}>
                    <span className={styles.mailSender}>
                      {currentTab === "sent" ? `To: ${mail.recipient}` : mail.sender.name}
                    </span>
                    <span className={styles.mailDate}>
                      {new Date(mail.createdAt).toLocaleDateString()} {new Date(mail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.mailSubject}>{mail.subject}</div>
                  <div className={styles.mailSnippet}>{mail.body.substring(0, 100)}{mail.body.length > 100 ? "..." : ""}</div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
