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

export async function updateDomainRegistration(formData: FormData) {
  const id = formData.get("id") as string;
  const customerId = formData.get("customerId") as string;
  const domainName = formData.get("domainName") as string;
  const registrar = formData.get("registrar") as string;
  const registrationDate = new Date(formData.get("registrationDate") as string);
  const expiryDate = new Date(formData.get("expiryDate") as string);
  const autoRenewalStatus = formData.get("autoRenewalStatus") === "true";
  const domainCost = parseFloat(formData.get("domainCost") as string);
  const dnsDetails = formData.get("dnsDetails") as string;
  const nameservers = formData.get("nameservers") as string;

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status = "ACTIVE";
  if (diffDays < 0) {
    status = "EXPIRED";
  } else if (diffDays <= 30) {
    status = "EXPIRING_SOON";
  }

  // Check for duplicate domain name from ANOTHER domain
  const existingDomain = await prisma.domainRegistration.findUnique({ where: { domainName } });
  if (existingDomain && existingDomain.id !== id) {
    redirect(`/domains/${id}/edit?error=duplicate_domain`);
  }

  await prisma.domainRegistration.update({
    where: { id },
    data: {
      customerId, domainName, registrar, registrationDate, expiryDate,
      autoRenewalStatus, domainCost, dnsDetails, nameservers, status
    }
  });

  revalidatePath("/domains");
  redirect("/domains");
}

export async function deleteDomainRegistration(id: string) {
  await prisma.domainRegistration.delete({ where: { id } });
  revalidatePath("/domains");
}

export async function sendDomainReminderEmail(domainId: string) {
  const domain = await prisma.domainRegistration.findUnique({
    where: { id: domainId },
    include: { customer: true }
  });

  if (!domain || !domain.customer.email) return;

  const daysLeft = Math.ceil((domain.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const bodyHtml = `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Action Required: Domain Renewal</h2>
    <p>Hello <strong>${domain.customer.name}</strong>,</p>
    <p>Your domain <strong>${domain.domainName}</strong> is expiring in <strong>${daysLeft} days</strong> on ${domain.expiryDate.toLocaleDateString()}.</p>
    <p>To avoid any service interruption, please process the renewal at your earliest convenience.</p>
  `;
  
  await sendEmail(
    domain.customer.email,
    `⚠️ Domain Expiry Alert: ${domain.domainName} expires in ${daysLeft} days`,
    generateTechnextEmailHtml(
      "Domain Renewal", 
      bodyHtml,
      { text: "Renew Now", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${domain.customer.portalToken}` }
    )
  );
}
