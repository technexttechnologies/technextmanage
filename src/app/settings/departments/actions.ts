"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.department.create({
    data: {
      name,
      description
    }
  });

  revalidatePath("/settings/departments");
}

export async function deleteDepartment(id: string) {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  // Optional: check if users are assigned
  const usersCount = await prisma.user.count({
    where: { departmentId: id }
  });

  if (usersCount > 0) {
    throw new Error("Cannot delete department with assigned users");
  }

  await prisma.department.delete({
    where: { id }
  });

  revalidatePath("/settings/departments");
}
