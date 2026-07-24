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

  const customerName = formData.get("customerName") as string;
  const service = formData.get("service") as string;
  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const gst = parseFloat(formData.get("gst") as string) || 0;
  const paymentMethod = formData.get("paymentMethod") as string;
  const paymentDate = formData.get("paymentDate") as string;
  const invoiceRef = formData.get("invoiceRef") as string;
  const notes = formData.get("notes") as string;

  await prisma.erpIncome.create({
    data: {
      customerName,
      service,
      category,
      amount,
      gst,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      invoiceRef,
      notes,
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
