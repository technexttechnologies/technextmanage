"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveTemplate(data: FormData) {
  const id = data.get("id") as string | null;
  const name = data.get("name") as string;
  const type = data.get("type") as string;
  const subject = data.get("subject") as string | null;
  const body = data.get("body") as string;

  if (!name || !type || !body) {
    throw new Error("Missing required fields");
  }

  if (id) {
    await prisma.messageTemplate.update({
      where: { id },
      data: {
        name,
        type,
        subject: type === "EMAIL" ? subject : null,
        body,
      },
    });
  } else {
    await prisma.messageTemplate.create({
      data: {
        name,
        type,
        subject: type === "EMAIL" ? subject : null,
        body,
      },
    });
  }

  revalidatePath("/marketing/templates");
  redirect("/marketing/templates");
}

export async function deleteTemplate(id: string) {
  await prisma.messageTemplate.delete({
    where: { id },
  });
  revalidatePath("/marketing/templates");
  redirect("/marketing/templates");
}
