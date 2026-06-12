"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateCustomerProfile(customerId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const billingNotes = formData.get("billingNotes") as string;
  const paymentStatus = formData.get("paymentStatus") as string;
  const notes = formData.get("notes") as string;

  if (!name || !phone) {
    throw new Error("Name and Phone are required.");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name,
      company: company || null,
      phone,
      email: email || null,
      address: address || null,
      billingNotes: billingNotes || null,
      paymentStatus: paymentStatus || null,
      notes: notes || null,
    },
  });

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}
