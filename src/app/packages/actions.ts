"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  await prisma.servicePackage.create({
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
    }
  });

  redirect("/packages");
}
