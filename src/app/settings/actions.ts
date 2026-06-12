"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string; // in a real app, hash this

  if (!name || !email || !role || !password) {
    throw new Error("Missing required fields");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: password // dummy hashing for MVP
    }
  });

  revalidatePath("/settings");
}

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

export async function deleteEmployee(formData: FormData) {
  const userId = formData.get("userId") as string;

  if (userId) {
    // Basic protection against deleting the last admin
    const adminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });

    if (userToDelete?.role === "SUPER_ADMIN" && adminCount <= 1) {
      throw new Error("Cannot delete the last Super Admin.");
    }

    await prisma.user.delete({
      where: { id: userId }
    });
  }

  revalidatePath("/settings");
}
