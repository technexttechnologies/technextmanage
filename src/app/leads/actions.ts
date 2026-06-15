"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createLead(formData: FormData) {
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: "technexttechnologies@gmail.com",
        name: "Admin User",
        passwordHash: "dummy",
        role: "SUPER_ADMIN"
      }
    });
  }

  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const source = formData.get("source") as string;
  const notes = formData.get("notes") as string;

  const newLead = await prisma.lead.create({
    data: {
      name,
      company,
      phone,
      email,
      source,
      notes,
      status: "NEW", // Always starts as NEW
      assignedToId: adminUser.id,
    }
  });

  await prisma.inAppNotification.create({
    data: {
      userId: adminUser.id,
      title: "New Lead Created",
      message: `A new lead (${name}) has been created from ${source}.`,
      type: "INFO",
      link: `/leads/${newLead.id}`
    }
  });

  if (email) {
    const { templates } = await import("@/lib/email-templates");
    const { generateTechnextEmailHtml, sendEmail } = await import("@/lib/mailer");
    const emailHtml = generateTechnextEmailHtml(
      "Thank you for reaching out!",
      templates.leadAcknowledgement({ name: newLead.name })
    );
    await sendEmail(email, "We've received your enquiry - TechNext", emailHtml);
  }

  redirect("/leads");
}
