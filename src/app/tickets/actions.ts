"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitPublicTicket(formData: FormData) {
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;

  if (!email || !subject || !description) {
    throw new Error("Missing required fields");
  }

  // Look up customer by email
  const customer = await prisma.customer.findFirst({
    where: { email },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const projectId = customer?.projects?.[0]?.id || null;

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      customerId: customer?.id || null,
      projectId,
      messages: {
        create: {
          message: description,
          isInternal: false,
        },
      },
    },
  });

  // Revalidate internal tickets page
  revalidatePath("/tickets");
  return { success: true, ticketId: ticket.id };
}

export async function replyToTicket(ticketId: string, formData: FormData) {
  const message = formData.get("message") as string;
  const senderId = formData.get("senderId") as string; // Optional: empty if public
  const isInternal = formData.get("isInternal") === "true";

  if (!message) {
    throw new Error("Message is required");
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      message,
      senderId: senderId || null,
      isInternal,
    },
  });

  // Also update ticket's updatedAt
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function updateTicketStatus(ticketId: string, status: string) {
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}
