"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { insertCustomerToAronium } from "@/lib/aroniumSync";

export async function updateLeadStatus(leadId: string, newStatus: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: newStatus }
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function saveLeadNotes(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const notes = formData.get("notes") as string;

  await prisma.lead.update({
    where: { id: leadId },
    data: { notes }
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadDetails(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  await prisma.lead.update({
    where: { id: leadId },
    data: { name, company, phone, email }
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function convertToCustomer(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "CONVERTED") return; // Already converted

  // 1. Create the customer in Technext CRM
  const customer = await prisma.customer.create({
    data: {
      name: lead.name,
      company: lead.company,
      phone: lead.phone || "0000000000",
      email: lead.email,
      notes: `Converted from lead. Original notes: ${lead.notes || ''}`,
      status: "ACTIVE",
      assignedToId: lead.assignedToId
    }
  });

  // 2. Mark the lead as converted
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "CONVERTED" }
  });

  // 3. Attempt to push to Aronium Database directly
  try {
    await insertCustomerToAronium(customer.name, customer.phone, customer.email || "");
  } catch (err) {
    console.error("Non-fatal error pushing to Aronium:", err);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/customers");
}
