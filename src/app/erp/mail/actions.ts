"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function sendInternalMail(formData: FormData) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "HR", "OPERATIONS"].includes(session.role as string)) {
    throw new Error("Unauthorized");
  }

  const to = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const cc = formData.get("cc") as string;
  const bcc = formData.get("bcc") as string;

  if (!to || !subject || !body) {
    throw new Error("Missing required fields");
  }

  await prisma.erpMail.create({
    data: {
      recipient: to,
      subject,
      body,
      cc: cc || null,
      bcc: bcc || null,
      isInternal: true,
      status: "SENT",
      senderId: session.userId as string
    }
  });

  revalidatePath("/erp/mail");
  redirect("/erp/mail?tab=sent");
}
