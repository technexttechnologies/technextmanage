"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSupportTicket(token: string, formData: FormData) {
  const customer = await prisma.customer.findUnique({ where: { portalToken: token } });
  if (!customer) throw new Error("Unauthorized");

  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const projectId = formData.get("projectId") as string;

  if (!subject || !description) {
    throw new Error("Subject and description are required.");
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      priority,
      status: "OPEN",
      customerId: customer.id,
      assignedToId: customer.assignedToId, // Automatically assign to the customer's account manager
      projectId: projectId || null,
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "New Ticket Opened",
      entityType: "SUPPORT_TICKET",
      entityId: ticket.id,
      userId: customer.assignedToId,
      details: `Customer ${customer.name} opened a new support ticket via the portal: ${subject}`
    }
  });

  revalidatePath(`/portal/${token}`);
  revalidatePath(`/tickets`);
  redirect(`/portal/${token}`);
}
