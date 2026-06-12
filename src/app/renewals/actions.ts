"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRenewal(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const type = formData.get("type") as string;
  const expiryDateStr = formData.get("expiryDate") as string;

  if (!customerId || !type || !expiryDateStr) {
    throw new Error("Missing required fields");
  }

  await prisma.renewal.create({
    data: {
      customerId,
      type,
      expiryDate: new Date(expiryDateStr),
      status: "ACTIVE",
    }
  });

  redirect("/renewals");
}

export async function markRenewed(formData: FormData) {
  const renewalId = formData.get("renewalId") as string;
  const newExpiryDateStr = formData.get("newExpiryDate") as string;

  if (renewalId && newExpiryDateStr) {
    await prisma.renewal.update({
      where: { id: renewalId },
      data: { 
        status: "RENEWED", // Wait, maybe it should just stay ACTIVE and push the date?
        expiryDate: new Date(newExpiryDateStr)
      }
    });
  }

  revalidatePath("/renewals");
}

export async function sendManualRenewalReminder(renewalId: string) {
  const renewal = await prisma.renewal.findUnique({
    where: { id: renewalId },
    include: { customer: true }
  });

  if (!renewal || !renewal.customer.email) return { success: false, error: "No email found" };

  const { sendEmail, generateTechnextEmailHtml } = await import("@/lib/mailer");
  
  const emailTemplate = await prisma.messageTemplate.findFirst({
    where: { name: "Renewal Expiring", type: "EMAIL" }
  });

  const daysLeft = Math.ceil((renewal.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  let subject = emailTemplate?.subject || `⚠️ Renewal Alert: Your ${renewal.type} expires in ${daysLeft} days`;
  let bodyHtml = emailTemplate?.body || `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Hello {{customer_name}},</h2>
    <p style="font-size: 16px;">Your <strong>{{renewal_type}}</strong> service is expiring on <strong>{{expiry_date}}</strong> ({{days_left}} days from now).</p>
    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 500;">Please contact us to renew your service and avoid any disruption.</p>
    </div>
  `;

  subject = subject.replace(/{{customer_name}}/g, renewal.customer.name)
                   .replace(/{{renewal_type}}/g, renewal.type)
                   .replace(/{{days_left}}/g, daysLeft.toString());
  
  bodyHtml = bodyHtml.replace(/{{customer_name}}/g, renewal.customer.name)
                     .replace(/{{renewal_type}}/g, renewal.type)
                     .replace(/{{expiry_date}}/g, renewal.expiryDate.toLocaleDateString())
                     .replace(/{{days_left}}/g, daysLeft.toString());

  await sendEmail(
    renewal.customer.email,
    subject,
    generateTechnextEmailHtml("Service Expiration Warning", bodyHtml)
  );
  
  return { success: true };
}
