"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/mailer";

export async function createAMC(formData: FormData) {
  const title = formData.get("title") as string;
  const customerId = formData.get("customerId") as string;
  const projectId = formData.get("projectId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as string || "ACTIVE";

  await prisma.aMC.create({
    data: {
      title,
      customerId,
      projectId: projectId || null,
      amount,
      startDate,
      endDate,
      status,
      notes: notes || null,
    },
  });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (customer?.email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "AMC Created" } });
    const emailSubject = template?.subject || "Annual Maintenance Contract (AMC) Created";
    let emailBody = template?.body || `Your AMC for "${title}" has been created successfully.\n\nAmount: ${amount}\nStart Date: ${startDate.toDateString()}\nEnd Date: ${endDate.toDateString()}`;
    
    emailBody = emailBody.replace(/\{\{title\}\}/g, title)
                         .replace(/\{\{amount\}\}/g, amount.toString())
                         .replace(/\{\{start_date\}\}/g, startDate.toDateString())
                         .replace(/\{\{end_date\}\}/g, endDate.toDateString())
                         .replace(/\n/g, '<br/>');

    await sendEmail(customer.email, emailSubject, emailBody);
  }

  revalidatePath("/amc");
  revalidatePath(`/customers/${customerId}`);
  redirect("/amc");
}

export async function updateAMCStatus(id: string, status: string) {
  const amc = await prisma.aMC.update({
    where: { id },
    data: { status },
    include: { customer: true }
  });

  if (amc.customer?.email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "AMC Status Update" } });
    const emailSubject = template?.subject || `Update on your AMC: ${amc.title}`;
    let emailBody = template?.body || `The status of your Annual Maintenance Contract (AMC) for "${amc.title}" has been updated to: ${status}.`;
    
    emailBody = emailBody.replace(/\{\{title\}\}/g, amc.title)
                         .replace(/\{\{status\}\}/g, status)
                         .replace(/\n/g, '<br/>');

    await sendEmail(amc.customer.email, emailSubject, emailBody);
  }

  revalidatePath("/amc");
  revalidatePath(`/customers/${amc.customerId}`);
}

export async function deleteAMC(id: string) {
  const amc = await prisma.aMC.findUnique({ where: { id } });
  if (amc) {
    await prisma.aMC.delete({
      where: { id },
    });
    revalidatePath("/amc");
    revalidatePath(`/customers/${amc.customerId}`);
  }
}
