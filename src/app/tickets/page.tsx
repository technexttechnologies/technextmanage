export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Ticket, UserCircle, Calendar } from "lucide-react";
import styles from "./page.module.css";
import { formatDistanceToNow } from "date-fns";

export default async function TicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      customer: true,
      assignedTo: true,
    },
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Tickets</h1>
          <p className={styles.subtitle}>Manage customer support requests.</p>
        </div>
        <Link href="/tickets/new" className="btn-primary">
          + New Ticket
        </Link>
      </header>

      {tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Ticket size={48} style={{ color: "var(--text-muted)", marginBottom: "16px" }} />
          <h2>No tickets yet</h2>
          <p style={{ color: "var(--text-secondary)" }}>All caught up!</p>
        </div>
      ) : (
        <div className={styles.ticketList}>
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`} className={styles.ticketCard}>
              <div className={styles.ticketInfo}>
                <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                <div className={styles.ticketMeta}>
                  {ticket.customer && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <UserCircle size={14} /> {ticket.customer.name}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={14} /> Updated {formatDistanceToNow(new Date(ticket.updatedAt))} ago
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className={`${styles.priorityBadge} ${styles[ticket.priority.toLowerCase()]}`}>
                  {ticket.priority}
                </span>
                <span className={`${styles.statusBadge} ${styles[ticket.status.toLowerCase()]}`}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
