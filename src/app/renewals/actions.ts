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
