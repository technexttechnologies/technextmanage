"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePlatformSettings(formData: FormData) {
  const geminiApiKey = formData.get("geminiApiKey") as string;
  const settings = await prisma.systemSettings.findFirst();

  if (settings) {
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: { geminiApiKey }
    });
  } else {
    await prisma.systemSettings.create({
      data: { geminiApiKey }
    });
  }

  revalidatePath("/settings");
  revalidatePath("/email");
}
