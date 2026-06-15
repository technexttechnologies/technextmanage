"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mailer";
import { createNotification } from "@/app/notifications/actions";

// We need a stable identifier for a live chat ticket.
const CHAT_SUBJECT = "Live Chat Request";

export async function getLiveChatTicket(token: string) {
  const customer = await prisma.customer.findUnique({ where: { portalToken: token } });
  if (!customer) throw new Error("Unauthorized");

  // Find an open Live Chat ticket
  let ticket = await prisma.supportTicket.findFirst({
    where: {
      customerId: customer.id,
      subject: CHAT_SUBJECT,
      status: { notIn: ["CLOSED", "RESOLVED"] }
    },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { sender: true }
      }
    }
  });

  return ticket;
}

export async function sendChatMessage(token: string, messageText: string) {
  const customer = await prisma.customer.findUnique({ where: { portalToken: token } });
  if (!customer) throw new Error("Unauthorized");

  let ticket = await prisma.supportTicket.findFirst({
    where: {
      customerId: customer.id,
      subject: CHAT_SUBJECT,
      status: { notIn: ["CLOSED", "RESOLVED"] }
    }
  });

  if (!ticket) {
    // Create a new Live Chat ticket
    ticket = await prisma.supportTicket.create({
      data: {
        subject: CHAT_SUBJECT,
        description: "Customer initiated a live chat from the portal.",
        priority: "MEDIUM",
        status: "OPEN",
        customerId: customer.id,
        assignedToId: customer.assignedToId,
      }
    });

    // We only log the creation once
    await prisma.activityLog.create({
      data: {
        action: "Live Chat Initiated",
        entityType: "SUPPORT_TICKET",
        entityId: ticket.id,
        userId: customer.assignedToId,
        details: `Customer ${customer.name} started a new live chat.`
      }
    });
  }

  // Add the message
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: null, // null means it's from the customer
      message: messageText,
      isInternal: false,
    }
  });

  // Revalidate to update server components (if any rely on it)
  revalidatePath(`/portal/${token}`);
  revalidatePath(`/tickets/${ticket.id}`);

  // Send email and in-app notification to the assigned admin
  if (customer.assignedToId) {
    // In-app notification
    await createNotification(
      customer.assignedToId,
      `New Chat Message: ${customer.name}`,
      `Received a new live chat message from ${customer.name}`,
      `/tickets/${ticket.id}`,
      "INFO"
    );

    const adminUser = await prisma.user.findUnique({ where: { id: customer.assignedToId } });
    if (adminUser && adminUser.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>New Chat Message from ${customer.name}</h2>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; white-space: pre-wrap;">
            ${messageText}
          </div>
          <p>This message was sent via the Client Portal Live Chat.</p>
          <p><a href="https://technextmanage.vercel.app/tickets/${ticket.id}" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply in Dashboard</a></p>
        </div>
      `;
      // Don't await this so it doesn't block the UI
      sendEmail(adminUser.email, `New Chat Message: ${customer.name}`, emailHtml).catch(console.error);
    }
  }

  // Return the newly fetched messages so the client can update instantly
  const updatedTicket = await prisma.supportTicket.findUnique({
    where: { id: ticket.id },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { sender: true }
      }
    }
  });

  return updatedTicket?.messages || [];
}
