"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth";

export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !role || !password) {
    throw new Error("Missing required fields");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashedPassword
    }
  });

  revalidatePath("/settings/users");
  revalidatePath("/settings");
}

export async function resetUserPassword(formData: FormData) {
  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword) {
    throw new Error("Missing user ID or password");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword }
  });

  revalidatePath("/settings/users");
}

export async function deleteEmployee(formData: FormData) {
  const userId = formData.get("userId") as string;

  if (userId) {
    const adminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });

    if (userToDelete?.role === "SUPER_ADMIN" && adminCount <= 1) {
      throw new Error("Cannot delete the last Super Admin.");
    }

    await prisma.user.delete({
      where: { id: userId }
    });
  }

  revalidatePath("/settings/users");
  revalidatePath("/settings");
}
