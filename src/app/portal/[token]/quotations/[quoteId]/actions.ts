"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateQuotationStatus(quoteId: string, token: string, newStatus: "APPROVED" | "REJECTED") {
  const customer = await prisma.customer.findUnique({ where: { portalToken: token } });
  if (!customer) throw new Error("Unauthorized");

  const quote = await prisma.quotation.findFirst({
    where: { id: quoteId, customerId: customer.id }
  });

  if (!quote) throw new Error("Quotation not found");

  if (quote.status === "APPROVED" || quote.status === "REJECTED") {
    throw new Error("Quotation is already finalized.");
  }

  await prisma.quotation.update({
    where: { id: quoteId },
    data: { status: newStatus }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: newStatus === "APPROVED" ? "Customer Approved Quotation" : "Customer Rejected Quotation",
      entityType: "QUOTATION",
      entityId: quoteId,
      userId: customer.assignedToId, // We attribute it to the assigned admin in the logs, but add details
      details: `Customer ${customer.name} marked the quotation as ${newStatus} via the client portal.`
    }
  });

  revalidatePath(`/portal/${token}/quotations/${quoteId}`);
  revalidatePath(`/portal/${token}`);
  revalidatePath(`/quotations`);
}
