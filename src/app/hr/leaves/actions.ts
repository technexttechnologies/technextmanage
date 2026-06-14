"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestLeave(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");

  const type = formData.get("type") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  if (!type || !startDateStr || !endDateStr || !reason) {
    throw new Error("Missing required fields");
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (endDate < startDate) {
    throw new Error("End date cannot be before start date");
  }

  await prisma.leaveRequest.create({
    data: {
      userId: session.userId as string,
      type,
      startDate,
      endDate,
      reason,
      status: "PENDING"
    }
  });

  revalidatePath("/hr/leaves");
}
