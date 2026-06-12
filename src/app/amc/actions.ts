"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAMC(formData: FormData) {
  const title = formData.get("title") as string;
  const customerId = formData.get("customerId") as string;
  const projectId = formData.get("projectId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as string || "ACTIVE";

  await prisma.aMC.create({
    data: {
      title,
      customerId,
      projectId: projectId || null,
      amount,
      startDate,
      endDate,
      status,
      notes: notes || null,
    },
  });

  revalidatePath("/amc");
  revalidatePath(`/customers/${customerId}`);
  redirect("/amc");
}

export async function updateAMCStatus(id: string, status: string) {
  const amc = await prisma.aMC.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/amc");
  revalidatePath(`/customers/${amc.customerId}`);
}

export async function deleteAMC(id: string) {
  const amc = await prisma.aMC.findUnique({ where: { id } });
  if (amc) {
    await prisma.aMC.delete({
      where: { id },
    });
    revalidatePath("/amc");
    revalidatePath(`/customers/${amc.customerId}`);
  }
}
