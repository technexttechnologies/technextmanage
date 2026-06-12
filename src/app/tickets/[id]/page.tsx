export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle, Calendar, Send } from "lucide-react";
import styles from "./page.module.css";
import { formatDistanceToNow } from "date-fns";
import TicketClientActions from "./TicketClientActions";
import TicketReplyForm from "./TicketReplyForm";

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getSession();
  const userId = session?.userId as string;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: resolvedParams.id },
    include: {
      customer: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/tickets" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Tickets</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <TicketClientActions ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.ticketHeaderCard}>
          <h1 className={styles.subject}>{ticket.subject}</h1>
          <div className={styles.ticketMetaRow}>
            <span className={`${styles.statusBadge} ${styles[ticket.status.toLowerCase()]}`}>
              {ticket.status.replace("_", " ")}
            </span>
            <span className={`${styles.priorityBadge} ${styles[ticket.priority.toLowerCase()]}`}>
              {ticket.priority} Priority
            </span>
            {ticket.customer && (
              <span className={styles.metaItem}>
                <UserCircle size={16} /> {ticket.customer.name}
              </span>
            )}
            <span className={styles.metaItem}>
              <Calendar size={16} /> Created {new Date(ticket.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className={styles.messagesList}>
          {ticket.messages.map((msg) => {
            const isCustomer = !msg.senderId;
            return (
              <div key={msg.id} className={`${styles.messageWrapper} ${isCustomer ? styles.msgCustomer : styles.msgStaff}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.msgHeader}>
                    <strong>{isCustomer ? (ticket.customer?.name || "Customer") : msg.sender?.name || "Staff"}</strong>
                    <span className={styles.msgTime}>{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                    {msg.isInternal && <span className={styles.internalBadge}>Internal Note</span>}
                  </div>
                  <div className={styles.msgBody} style={{ whiteSpace: "pre-wrap" }}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.replyBox}>
          <h3>Add a Reply</h3>
          <form action="/api/tickets/reply" method="POST">
            {/* We will convert this to use server actions in the client component or directly here */}
            {/* Let's just use the client component for the reply form too, for better UX. Or standard server action with a wrapper */}
          </form>
          <TicketReplyForm ticketId={ticket.id} userId={userId} />
        </div>
      </div>
    </div>
  );
}
