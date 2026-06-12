"use server";

import { prisma } from "@/lib/prisma";
import path from "path";
import { sendEmail, generateTechNextEmailHtml } from "@/lib/mailer";
import { revalidatePath } from "next/cache";

export async function sendComposedEmail(formData: FormData) {
  const to = formData.get("toEmail") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const attachment = formData.get("attachment") as File | null;

  if (!to || !subject) {
    throw new Error("Recipient and subject are required");
  }

  const attachments: any[] = [];

  // 1. Process user uploaded PDF
  if (attachment && attachment.size > 0) {
    const arrayBuffer = await attachment.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    attachments.push({
      filename: attachment.name,
      content: buffer,
      contentType: attachment.type || "application/pdf"
    });
  }

  // Wrap the DB template (or AI body) in the beautiful global wrapper
  const bodyContent = `
    <div style="font-size: 16px; color: #1e293b; line-height: 1.7;">
      ${body.replace(/\n/g, '<br>')}
    </div>
  `;

  const htmlBody = generateTechNextEmailHtml(subject, bodyContent);

  await sendEmail(to, subject, htmlBody, attachments);
  revalidatePath("/email");
}

export async function saveEmailSettings(formData: FormData) {
  const smtpEmail = formData.get("smtpEmail") as string;
  const smtpPassword = formData.get("smtpPassword") as string;

  const existing = await prisma.systemSettings.findFirst();
  if (existing) {
    await prisma.systemSettings.update({
      where: { id: existing.id },
      data: { smtpEmail, smtpPassword }
    });
  } else {
    await prisma.systemSettings.create({
      data: { smtpEmail, smtpPassword }
    });
  }
  revalidatePath("/email");
}
