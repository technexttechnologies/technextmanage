"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveTemplate(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const type = formData.get("type") as string;

  if (id) {
    await prisma.messageTemplate.update({
      where: { id },
      data: { name, subject, body, type }
    });
  } else {
    await prisma.messageTemplate.create({
      data: { name, subject, body, type }
    });
  }

  revalidatePath("/settings/templates");
  revalidatePath("/email");
  redirect("/settings/templates");
}

export async function deleteTemplate(id: string) {
  await prisma.messageTemplate.delete({ where: { id } });
  revalidatePath("/settings/templates");
  revalidatePath("/email");
}
