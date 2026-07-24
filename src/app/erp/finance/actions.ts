"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createIncome(formData: FormData) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    throw new Error("Unauthorized");
  }

  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentMethod = formData.get("paymentMethod") as string;
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;
  const aroniumId = formData.get("aroniumId") as string || undefined;

  await prisma.erpIncome.create({
    data: {
      category,
      amount,
      paymentMethod,
      date: new Date(date),
      notes,
      aroniumId,
      recordedById: session.userId as string,
    },
  });

  revalidatePath("/erp/finance/income");
  revalidatePath("/erp/finance");
  redirect("/erp/finance/income");
}

export async function createExpense(formData: FormData) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const vendor = formData.get("vendor") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const gst = parseFloat(formData.get("gst") as string) || 0;
  const paymentMethod = formData.get("paymentMethod") as string;
  const paymentDate = formData.get("paymentDate") as string;
  const notes = formData.get("notes") as string;

  await prisma.erpExpense.create({
    data: {
      title,
      category,
      vendor,
      amount,
      gst,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      notes,
      recordedById: session.userId as string,
    },
  });

  revalidatePath("/erp/finance/expense");
  revalidatePath("/erp/finance");
  redirect("/erp/finance/expense");
}

export async function updateExpenseStatus(id: string, status: string) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role as string)) {
    throw new Error("Unauthorized: Only Admins can approve expenses.");
  }

  await prisma.erpExpense.update({
    where: { id },
    data: {
      status,
      ...(status !== "PENDING" ? { approvedById: session.userId as string } : { approvedById: null }),
    },
  });

  revalidatePath("/erp/finance/expense");
  revalidatePath("/erp/finance");
}

export async function sendReportEmail(data: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments: { filename: string; content: string; contentType: string }[];
}) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS"].includes(session.role as string)) {
    throw new Error("Unauthorized");
  }

  // Create ErpMail record
  const mail = await prisma.erpMail.create({
    data: {
      recipient: data.to,
      cc: data.cc || null,
      bcc: data.bcc || null,
      subject: data.subject,
      body: data.body,
      attachments: JSON.stringify(data.attachments),
      status: "PENDING",
      senderId: session.userId as string,
    }
  });

  // Call sendErpEmail
  const { sendErpEmail } = await import("@/lib/erp/mailer");
  await sendErpEmail(mail.id);

  return { success: true };
}

export async function deleteIncome(id: string) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role as string)) {
    throw new Error("Unauthorized: Only Admins can delete records.");
  }
  await prisma.erpIncome.delete({ where: { id } });
  revalidatePath("/erp/finance/income");
  revalidatePath("/erp/finance");
}

export async function deleteExpense(id: string) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role as string)) {
    throw new Error("Unauthorized: Only Admins can delete records.");
  }
  await prisma.erpExpense.delete({ where: { id } });
  revalidatePath("/erp/finance/expense");
  revalidatePath("/erp/finance");
}
