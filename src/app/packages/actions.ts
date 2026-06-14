"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";

export async function createServicePackage(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const packageName = formData.get("packageName") as string;
  const packageType = formData.get("packageType") as string;
  const packagePrice = parseFloat(formData.get("packagePrice") as string);
  const purchaseDate = new Date(formData.get("purchaseDate") as string);
  const renewalDateStr = formData.get("renewalDate") as string;
  const renewalDate = renewalDateStr ? new Date(renewalDateStr) : null;
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
      purchaseDate,
      renewalDate,
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

  redirect("/packages");
}
