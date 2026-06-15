"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";

export async function createServicePackage(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const packageName = formData.get("packageName") as string;
  const packageType = formData.get("packageType") as string;
  const packagePrice = parseFloat(formData.get("packagePrice") as string);
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const renewalDateStr = formData.get("renewalDate") as string;
  const isLifetime = formData.get("isLifetime") === "on";
  const contractPeriod = parseInt(formData.get("contractPeriod") as string);
  const status = formData.get("status") as string;
  const assignedTeam = formData.get("assignedTeam") as string;
  const notes = formData.get("notes") as string;

  const packageRecord = await prisma.servicePackage.create({
    data: {
      customerId,
      packageName,
      packageType,
      packagePrice,
      purchaseDate: new Date(purchaseDateStr),
      renewalDate: isLifetime ? null : (renewalDateStr ? new Date(renewalDateStr) : null),
      isLifetime,
      contractPeriod,
      status,
      assignedTeam,
      notes,
    },
    include: { customer: true }
  });

  if (packageRecord.customer?.email) {
    const html = generateTechnextEmailHtml(
      "Service Package Activated",
      templates.packageActivation({
        customerName: packageRecord.customer.name,
        packageName: packageRecord.packageName,
        packageType: packageRecord.packageType,
        purchaseDate: packageRecord.purchaseDate.toLocaleDateString(),
      }),
      { text: "View Client Portal", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${packageRecord.customer.portalToken}` }
    );
    await sendEmail(packageRecord.customer.email, `Package Activated: ${packageRecord.packageName}`, html);
  }

  revalidatePath("/packages");
  redirect("/packages");
}

export async function updatePackage(formData: FormData) {
  const id = formData.get("id") as string;
  const customerId = formData.get("customerId") as string;
  const packageName = formData.get("packageName") as string;
  const packageType = formData.get("packageType") as string;
  const contractPeriod = parseInt(formData.get("contractPeriod") as string);
  const packagePrice = parseFloat(formData.get("packagePrice") as string);
  const renewalDateStr = formData.get("renewalDate") as string;
  const isLifetime = formData.get("isLifetime") === "on";
  const renewalDate = isLifetime ? null : (renewalDateStr ? new Date(renewalDateStr) : null);
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : undefined;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  await prisma.servicePackage.update({
    where: { id },
    data: {
      customerId, packageName, packageType, contractPeriod,
      packagePrice, renewalDate, status, notes,
      isLifetime,
      ...(purchaseDate && { purchaseDate })
    }
  });

  revalidatePath("/packages");
  redirect("/packages");
}

export async function deletePackage(id: string) {
  await prisma.servicePackage.delete({ where: { id } });
  revalidatePath("/packages");
}

export async function sendPackageReminderEmail(packageId: string) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId },
    include: { customer: true }
  });

  if (!pkg || !pkg.customer.email || !pkg.renewalDate) return;

  const daysLeft = Math.ceil((pkg.renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const bodyHtml = `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Action Required: Service Package Renewal</h2>
    <p>Hello <strong>${pkg.customer.name}</strong>,</p>
    <p>Your service package <strong>${pkg.packageName}</strong> is due for renewal in <strong>${daysLeft} days</strong> on ${pkg.renewalDate.toLocaleDateString()}.</p>
    <p>Please contact us or visit your client portal to process the renewal.</p>
  `;
  
  await sendEmail(
    pkg.customer.email,
    `⚠️ Package Renewal Alert: ${pkg.packageName} expires in ${daysLeft} days`,
    generateTechnextEmailHtml(
      "Service Renewal", 
      bodyHtml,
      { text: "Renew Now", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${pkg.customer.portalToken}` }
    )
  );
}
