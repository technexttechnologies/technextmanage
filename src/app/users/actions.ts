"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword, getSession } from "@/lib/auth";

// Check if current user is admin
async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized: Administrator access required.");
  }
  return session;
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  const role = (formData.get("role") as string) || "SALES";
  const designation = formData.get("designation") as string;
  const departmentId = formData.get("departmentId") as string;
  const password = formData.get("password") as string;
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!name || !email || !password) {
    throw new Error("Full name, email, and password are required.");
  }

  // Check if user with email already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error(`A user with email ${email} already exists.`);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      role,
      designation: designation || null,
      departmentId: departmentId || null,
      passwordHash,
      isActive: isActive ?? true,
    },
  });

  revalidatePath("/users");
  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  await requireAdmin();

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const designation = formData.get("designation") as string;
  const departmentId = formData.get("departmentId") as string;
  const isActive = formData.get("isActive") === "true";

  if (!userId || !name || !email || !role) {
    throw new Error("Missing required user information.");
  }

  // Check if updating email conflicts with another user
  const emailConflict = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: userId },
    },
  });

  if (emailConflict) {
    throw new Error(`Email ${email} is already in use by another account.`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone: phone || null,
      role,
      designation: designation || null,
      departmentId: departmentId || null,
      isActive,
    },
  });

  revalidatePath("/users");
  revalidatePath("/settings/users");
  return { success: true };
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/users");
  revalidatePath("/settings/users");
  return { success: true };
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  await requireAdmin();

  if (!userId) throw new Error("Missing user ID");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/users");
  revalidatePath("/settings/users");
  return { success: true, newStatus: !currentStatus };
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();

  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("Missing user ID");

  // Safeguard: Ensure at least one Super Admin remains
  const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
  if (userToDelete?.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) {
      throw new Error("Cannot delete the only Super Administrator account.");
    }
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/users");
  revalidatePath("/settings/users");
  return { success: true };
}
