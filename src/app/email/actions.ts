"use server";

import { prisma } from "@/lib/prisma";
import path from "path";
import { sendEmail } from "@/lib/mailer";
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

  // 2. Add TechNext Logo as inline CID attachment
  attachments.push({
    filename: 'technext-logo.jpg',
    path: path.join(process.cwd(), 'public', 'technext-logo.jpg'),
    cid: 'technextlogo'
  });

  // Wrap the DB template (or AI body) in a standard clean wrapper
  const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
    ${body.replace(/\n/g, '<br>')}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;">
      <img src="cid:technextlogo" alt="TechNext Technologies Logo" style="max-height: 40px; margin-bottom: 8px;" />
      <p style="color:#6B7280;font-size:13px;margin:0;">— TechNext Technologies</p>
    </div>
  </div>`;

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
