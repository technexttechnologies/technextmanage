"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { draftEmailWithAI } from "@/lib/ai";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";

export async function generateCampaignContent(prompt: string) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Use our existing AI helper
  const htmlContent = await draftEmailWithAI(
    `You are writing a professional company newsletter/email broadcast. 
    Use HTML formatting (like <p>, <b>, <ul>, <br>) so it looks beautiful in an email client. 
    Do NOT include a Subject line in the body. Do NOT include any markdown code blocks.
    Here is what it should be about: ${prompt}`,
    "professional and engaging"
  );

  // Clean up any markdown blocks if the AI disobeyed
  return htmlContent.replace(/```html\n?|\n?```/g, "").trim();
}

export async function sendCampaign(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const audience = formData.get("audience") as string;

  if (!subject || !body || !audience) {
    throw new Error("Missing required fields");
  }

  // 1. Determine recipients based on audience
  let recipients: { name: string; email: string | null }[] = [];

  if (audience === "ALL_CUSTOMERS") {
    recipients = await prisma.customer.findMany({
      where: { status: "ACTIVE" },
      select: { name: true, email: true }
    });
  } else if (audience === "ACTIVE_AMCS") {
    const amcs = await prisma.aMC.findMany({
      where: { status: "ACTIVE" },
      include: { customer: true }
    });
    // Extract unique customers
    const uniqueCustomers = new Map();
    amcs.forEach(amc => {
      if (amc.customer.email && !uniqueCustomers.has(amc.customer.email)) {
        uniqueCustomers.set(amc.customer.email, { name: amc.customer.name, email: amc.customer.email });
      }
    });
    recipients = Array.from(uniqueCustomers.values());
  } else if (audience === "LEADS") {
    recipients = await prisma.lead.findMany({
      where: { status: { notIn: ["CONVERTED", "LOST"] } },
      select: { name: true, email: true }
    });
  }

  // Filter out those without emails
  recipients = recipients.filter(r => r.email);
  let sentCount = 0;

  // 2. Send emails
  // For small-medium CRMs, a loop is fine. For larger ones, a background worker is better.
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    
    // Personalize if you want, or just wrap in the nice template
    const personalizedBody = body.replace(/\[Name\]|\[Customer Name\]/gi, recipient.name);
    
    const emailHtml = generateTechnextEmailHtml(subject, personalizedBody);
    
    const result = await sendEmail(recipient.email, subject, emailHtml);
    if (result.success) {
      sentCount++;
    }
  }

  // 3. Save Campaign to Database
  await prisma.campaign.create({
    data: {
      subject,
      body,
      audience,
      sentCount
    }
  });

  revalidatePath("/campaigns");
  redirect("/campaigns");
}
