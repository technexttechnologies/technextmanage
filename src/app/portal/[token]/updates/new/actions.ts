"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUpdateRequest(token: string, formData: FormData) {
  const customer = await prisma.customer.findUnique({ where: { portalToken: token } });
  if (!customer) throw new Error("Unauthorized");

  const websiteUrl = formData.get("websiteUrl") as string;
  const changes = formData.get("changes") as string;
  const priority = formData.get("priority") as string;

  if (!websiteUrl || !changes) {
    throw new Error("Website URL and changes description are required.");
  }

  const subject = `Website Update Request: ${websiteUrl}`;
  const description = `**Target Website:** ${websiteUrl}\n\n**Requested Changes:**\n${changes}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      priority,
      status: "OPEN",
      customerId: customer.id,
      assignedToId: customer.assignedToId,
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "Website Update Requested",
      entityType: "SUPPORT_TICKET",
      entityId: ticket.id,
      userId: customer.assignedToId,
      details: `Customer ${customer.name} requested an update for ${websiteUrl}.`
    }
  });

  revalidatePath(`/portal/${token}`);
  revalidatePath(`/tickets`);
  redirect(`/portal/${token}`);
}
