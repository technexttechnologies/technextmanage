
"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await getSession();
  if (!session || (!["SUPER_ADMIN", "ADMIN", "OPERATIONS"].includes(session.role as string))) {
    redirect("/");
  }
}

export async function createSubscription(formData: FormData) {
  await requireAuth();

  const nextBillingDateStr = formData.get("nextBillingDate") as string;

  const data = {
    name: formData.get("name") as string,
    provider: formData.get("provider") as string,
    cost: parseFloat(formData.get("cost") as string) || 0,
    billingCycle: formData.get("billingCycle") as string,
    nextBillingDate: new Date(nextBillingDateStr),
    reminderSent: false,
    notes: formData.get("notes") as string || "",
  };

  await prisma.erpSubscription.create({ data });
  revalidatePath("/erp/subscriptions");
  redirect("/erp/subscriptions");
}
