"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string || "PLANNING";
  const customerId = formData.get("customerId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  let startDate = new Date();
  if (startDateStr) {
    startDate = new Date(startDateStr);
  }

  let endDate = null;
  if (endDateStr) {
    endDate = new Date(endDateStr);
  }

  // Ensure an admin user exists for assignment
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { email: "admin@technext.com", name: "Admin", passwordHash: "dummy", role: "SUPER_ADMIN" }
    });
  }

  await prisma.project.create({
    data: {
      name,
      description,
      status,
      startDate,
      endDate,
      assignedToId: adminUser.id,
      ...(customerId ? { customerId } : {})
    }
  });

  redirect("/projects");
}
