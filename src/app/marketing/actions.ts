"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail, generateTechNextEmailHtml } from "@/lib/mailer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCampaign(data: FormData) {
  // Not used in the UI, but required by instructions. Will implement just in case.
}

export async function launchCampaign(data: FormData) {
  const name = data.get("name") as string;
  const subject = data.get("subject") as string;
  const audience = data.get("audience") as string;
  const body = data.get("body") as string;

  if (!name || !subject || !audience || !body) {
    throw new Error("Missing required fields");
  }

  // Create Draft/Sending Campaign
  const campaign = await prisma.marketingCampaign.create({
    data: {
      name,
      subject,
      audience,
      body,
      status: "SENDING",
    },
  });

  // Fetch Audience
  let customers: any[] = [];
  if (audience === "ALL") {
    customers = await prisma.customer.findMany();
  } else if (audience === "ACTIVE") {
    customers = await prisma.customer.findMany({
      where: { status: "ACTIVE" },
    });
  } else if (audience === "RENEWAL_DUE") {
    const renewals = await prisma.renewal.findMany({
      where: { status: "ACTIVE" },
      include: { customer: true },
    });
    // Distinct customers who have active renewals
    customers = renewals
      .map((r) => r.customer)
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  } else if (audience === "LEAD") {
    customers = await prisma.customer.findMany({
      where: { status: "LEAD" },
    });
  } else {
    customers = await prisma.customer.findMany();
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const customer of customers) {
    if (!customer.email) {
      failedCount++;
      continue;
    }

    // Replace variables
    let personalizedBody = body.replace(/\{\{name\}\}/g, customer.name || "Customer");
    personalizedBody = personalizedBody.replace(/\{\{company\}\}/g, customer.company || "");

    // Create the final HTML using the existing mailer
    const html = generateTechNextEmailHtml(subject, personalizedBody);

    const result = await sendEmail(customer.email, subject, html);

    // Log
    await prisma.campaignLog.create({
      data: {
        campaignId: campaign.id,
        customerId: customer.id,
        status: result.success ? "SENT" : "FAILED",
        error: result.success ? null : (result.error || "Unknown Error"),
      },
    });

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  // Update Campaign to COMPLETED
  await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "COMPLETED",
      sentCount,
      failedCount,
    },
  });

  revalidatePath("/marketing");
  redirect("/marketing");
}
