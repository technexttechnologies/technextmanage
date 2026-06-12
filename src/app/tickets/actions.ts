"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mailer";

export async function submitPublicTicket(formData: FormData) {
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;

  if (!email || !subject || !description) {
    throw new Error("Missing required fields");
  }

  // Look up customer by email or phone
  const customer = await prisma.customer.findFirst({
    where: { 
      OR: [
        { email: email },
        { phone: phone }
      ]
    },
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

  if (email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "Ticket Created" } });
    const emailSubject = template?.subject || "Support Ticket Created";
    let emailBody = template?.body || `Your support ticket regarding "${subject}" has been created successfully.\n\nTicket ID: ${ticket.id}\nWe will get back to you shortly.`;
    
    emailBody = emailBody.replace(/\{\{ticket_id\}\}/g, ticket.id).replace(/\{\{subject\}\}/g, subject).replace(/\n/g, '<br/>');

    await sendEmail(email, emailSubject, emailBody);
  }

  // Revalidate internal tickets page
  revalidatePath("/tickets");
  return { success: true, ticketId: ticket.id };
}

export async function createInternalTicket(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      priority,
      customerId,
      projectId: customer?.projects?.[0]?.id || null,
      messages: {
        create: {
          message: description,
          isInternal: true,
        },
      },
    },
  });

  if (customer?.email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "Ticket Created" } });
    const emailSubject = template?.subject || "Support Ticket Created";
    let emailBody = template?.body || `Your support ticket regarding "${subject}" has been created successfully.\n\nTicket ID: ${ticket.id}\nWe will get back to you shortly.`;
    
    emailBody = emailBody.replace(/\{\{ticket_id\}\}/g, ticket.id).replace(/\{\{subject\}\}/g, subject).replace(/\n/g, '<br/>');

    await sendEmail(customer.email, emailSubject, emailBody);
  }

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
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
    include: { customer: true },
  });

  if (senderId && !isInternal && ticket.customer?.email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "Ticket Reply" } });
    const emailSubject = template?.subject || `Update on your ticket: ${ticket.subject}`;
    let emailBody = template?.body || `There is a new reply to your ticket (ID: ${ticket.id}):\n\n${message}`;
    
    emailBody = emailBody.replace(/\{\{ticket_id\}\}/g, ticket.id).replace(/\{\{message\}\}/g, message).replace(/\n/g, '<br/>');

    await sendEmail(ticket.customer.email, emailSubject, emailBody);
  }

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
