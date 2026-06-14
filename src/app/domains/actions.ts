"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";

export async function createDomainRegistration(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const domainName = formData.get("domainName") as string;
  const registrar = formData.get("registrar") as string;
  const registrationDate = new Date(formData.get("registrationDate") as string);
  const expiryDate = new Date(formData.get("expiryDate") as string);
  const renewalDateStr = formData.get("renewalDate") as string;
  const renewalDate = renewalDateStr ? new Date(renewalDateStr) : null;
  const autoRenewalStatus = formData.get("autoRenewalStatus") === "true";
  const domainCost = parseFloat(formData.get("domainCost") as string);
  const dnsDetails = formData.get("dnsDetails") as string;
  const nameservers = formData.get("nameservers") as string;

  // Calculate status based on expiry
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status = "ACTIVE";
  if (diffDays < 0) {
    status = "EXPIRED";
  } else if (diffDays <= 30) {
    status = "EXPIRING_SOON";
  }

  // Prevent crashes from duplicate domain names
  const existingDomain = await prisma.domainRegistration.findUnique({
    where: { domainName }
  });

  if (existingDomain) {
    redirect("/domains?error=duplicate_domain");
  }

  const domainRecord = await prisma.domainRegistration.create({
    data: {
      customerId,
      domainName,
      registrar,
      registrationDate,
      expiryDate,
      renewalDate,
      autoRenewalStatus,
      domainCost,
      dnsDetails,
      nameservers,
      status,
    },
    include: { customer: true }
  });

  if (domainRecord.customer?.email) {
    const html = generateTechnextEmailHtml(
      "Domain Registered",
      templates.domainActivation({
        customerName: domainRecord.customer.name,
        domainName: domainRecord.domainName,
        registrar: domainRecord.registrar,
        expiryDate: domainRecord.expiryDate.toLocaleDateString(),
      }),
      { text: "View Client Portal", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${domainRecord.customer.portalToken}` }
    );
    await sendEmail(domainRecord.customer.email, `Domain Registered: ${domainRecord.domainName}`, html);
  }

  revalidatePath("/domains");
  redirect("/domains");
}
