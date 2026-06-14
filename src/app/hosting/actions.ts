"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  await prisma.hostingAccount.create({
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
    }
  });

  redirect("/hosting");
}
