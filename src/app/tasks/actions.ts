"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateTaskStatus(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const status = formData.get("status") as string;

  if (taskId && status) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });
  }

  revalidatePath("/tasks");
}

export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const projectId = formData.get("projectId") as string;
  const dueDateStr = formData.get("dueDate") as string;

  let dueDate = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
  }

  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { email: "admin@technext.com", name: "Admin", passwordHash: "dummy", role: "SUPER_ADMIN" }
    });
  }

  await prisma.task.create({
    data: {
      title,
      description,
      status: "PENDING",
      dueDate,
      assignedToId: adminUser.id,
      ...(projectId ? { projectId } : {})
    }
  });

  redirect("/tasks");
}
