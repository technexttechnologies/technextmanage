"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addEvent(formData: FormData) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "HR", "OPERATIONS"].includes(session.role as string)) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const dateStr = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const location = formData.get("location") as string;
  const meetLink = formData.get("meetLink") as string;

  if (!title || !type || !dateStr) {
    throw new Error("Missing required fields");
  }

  await prisma.erpEvent.create({
    data: {
      title,
      description: description || null,
      type,
      date: new Date(dateStr),
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      meetLink: meetLink || null,
      createdById: session.userId as string
    }
  });

  revalidatePath("/erp/calendar");
  redirect("/erp/calendar");
}
