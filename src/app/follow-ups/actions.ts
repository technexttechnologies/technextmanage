"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFollowUp(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const type = formData.get("type") as string;
  const dateStr = formData.get("date") as string;
  const notes = formData.get("notes") as string;

  if (!customerId || !type || !dateStr) {
    throw new Error("Missing required fields");
  }

  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { email: "admin@technext.com", name: "Admin", passwordHash: "dummy", role: "SUPER_ADMIN" }
    });
  }

  await prisma.followUp.create({
    data: {
      customerId,
      type,
      date: new Date(dateStr),
      notes,
      status: "PENDING",
      assignedToId: adminUser.id
    }
  });

  redirect("/follow-ups");
}

export async function updateFollowUpStatus(formData: FormData) {
  const followUpId = formData.get("followUpId") as string;
  const status = formData.get("status") as string;

  if (followUpId && status) {
    await prisma.followUp.update({
      where: { id: followUpId },
      data: { status }
    });
  }

  revalidatePath("/follow-ups");
}
