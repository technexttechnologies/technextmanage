"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";

export async function createHostingAccount(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const hostingProvider = formData.get("hostingProvider") as string;
  const hostingPlan = formData.get("hostingPlan") as string;
  const serverLocation = formData.get("serverLocation") as string;
  const renewalDateStr = formData.get("renewalDate") as string;
  const isLifetime = formData.get("isLifetime") === "on";
  const renewalDate = isLifetime ? null : (renewalDateStr ? new Date(renewalDateStr) : null);
  const hostingCost = parseFloat(formData.get("hostingCost") as string);
  const storageUsage = formData.get("storageUsage") as string;
  const bandwidthUsage = formData.get("bandwidthUsage") as string;
  const sslStatus = formData.get("sslStatus") as string;
  const backupStatus = formData.get("backupStatus") as string;

  let status = "ACTIVE";
  if (!isLifetime && renewalDate) {
    const now = new Date();
    const diffTime = renewalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      status = "EXPIRED";
    } else if (diffDays <= 30) {
      status = "EXPIRING_SOON";
    }
  }

  const hostRecord = await prisma.hostingAccount.create({
    data: {
      customerId,
      hostingProvider,
      hostingPlan,
      serverLocation,
      renewalDate,
      isLifetime,
      hostingCost,
      storageUsage,
      bandwidthUsage,
      sslStatus,
      backupStatus,
      status,
    },
    include: { customer: true }
  });

  if (hostRecord.customer?.email) {
    const html = generateTechnextEmailHtml(
      "Hosting Provisioned",
      templates.hostingActivation({
        customerName: hostRecord.customer.name,
        hostingPlan: hostRecord.hostingPlan,
        hostingProvider: hostRecord.hostingProvider,
      }),
      { text: "View Client Portal", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${hostRecord.customer.portalToken}` }
    );
    await sendEmail(hostRecord.customer.email, `Hosting Setup Complete: ${hostRecord.hostingPlan}`, html);
  }

  revalidatePath("/hosting");
  redirect("/hosting");
}

export async function updateHostingAccount(formData: FormData) {
  const id = formData.get("id") as string;
  const customerId = formData.get("customerId") as string;
  const hostingProvider = formData.get("hostingProvider") as string;
  const hostingPlan = formData.get("hostingPlan") as string;
  const serverLocation = formData.get("serverLocation") as string;
  const renewalDateStr = formData.get("renewalDate") as string;
  const isLifetime = formData.get("isLifetime") === "on";
  const renewalDate = isLifetime ? null : (renewalDateStr ? new Date(renewalDateStr) : null);
  const hostingCost = parseFloat(formData.get("hostingCost") as string);
  const storageUsage = formData.get("storageUsage") as string;
  const bandwidthUsage = formData.get("bandwidthUsage") as string;
  const sslStatus = formData.get("sslStatus") as string;
  const backupStatus = formData.get("backupStatus") as string;

  let status = "ACTIVE";
  if (!isLifetime && renewalDate) {
    const now = new Date();
    const diffTime = renewalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      status = "EXPIRED";
    } else if (diffDays <= 30) {
      status = "EXPIRING_SOON";
    }
  }

  await prisma.hostingAccount.update({
    where: { id },
    data: {
      customerId, hostingProvider, hostingPlan, serverLocation, renewalDate, isLifetime,
      hostingCost, storageUsage, bandwidthUsage, sslStatus, backupStatus, status
    }
  });

  revalidatePath("/hosting");
  redirect("/hosting");
}

export async function deleteHostingAccount(id: string) {
  await prisma.hostingAccount.delete({ where: { id } });
  revalidatePath("/hosting");
}

export async function sendHostingReminderEmail(hostingId: string) {
  const host = await prisma.hostingAccount.findUnique({
    where: { id: hostingId },
    include: { customer: true }
  });

  if (!host || !host.customer.email || host.isLifetime || !host.renewalDate) return;

  const daysLeft = Math.ceil((host.renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const bodyHtml = `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Action Required: Hosting Renewal</h2>
    <p>Hello <strong>${host.customer.name}</strong>,</p>
    <p>Your hosting plan <strong>${host.hostingPlan}</strong> from <strong>${host.hostingProvider}</strong> is due for renewal in <strong>${daysLeft} days</strong> on ${host.renewalDate.toLocaleDateString()}.</p>
    <p>Please renew your plan to prevent any website downtime.</p>
  `;
  
  await sendEmail(
    host.customer.email,
    `⚠️ Hosting Renewal Alert: Plan expires in ${daysLeft} days`,
    generateTechnextEmailHtml(
      "Hosting Renewal", 
      bodyHtml,
      { text: "Renew Now", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${host.customer.portalToken}` }
    )
  );
}
