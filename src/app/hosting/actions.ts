"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";

export async function createHostingAccount(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const hostingProvider = formData.get("hostingProvider") as string;
  const hostingPlan = formData.get("hostingPlan") as string;
  const serverLocation = formData.get("serverLocation") as string;
  const renewalDate = new Date(formData.get("renewalDate") as string);
  const hostingCost = parseFloat(formData.get("hostingCost") as string);
  const storageUsage = formData.get("storageUsage") as string;
  const bandwidthUsage = formData.get("bandwidthUsage") as string;
  const sslStatus = formData.get("sslStatus") as string;
  const backupStatus = formData.get("backupStatus") as string;

  // Calculate status based on renewal
  const now = new Date();
  const diffTime = renewalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status = "ACTIVE";
  if (diffDays < 0) {
    status = "EXPIRED";
  } else if (diffDays <= 30) {
    status = "EXPIRING_SOON";
  }

  const hostRecord = await prisma.hostingAccount.create({
    data: {
      customerId,
      hostingProvider,
      hostingPlan,
      serverLocation,
      renewalDate,
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

  redirect("/hosting");
}
