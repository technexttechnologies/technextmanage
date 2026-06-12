"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAroniumRef(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const refType = formData.get("refType") as string;
  const refNumber = formData.get("refNumber") as string;
  const notes = formData.get("notes") as string;

  if (!customerId || !refType || !refNumber) {
    throw new Error("Missing required fields");
  }

  await prisma.aroniumReference.create({
    data: {
      customerId,
      refType,
      refNumber,
      notes,
    }
  });

  redirect("/aronium");
}

export async function deleteAroniumRef(formData: FormData) {
  const refId = formData.get("refId") as string;

  if (refId) {
    await prisma.aroniumReference.delete({
      where: { id: refId },
    });
  }

  revalidatePath("/aronium");
}
