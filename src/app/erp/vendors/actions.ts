
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

export async function createVendor(formData: FormData) {
  await requireAuth();

  const data = {
    companyName: formData.get("companyName") as string,
    contactPerson: formData.get("contactPerson") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    gstNumber: formData.get("gstNumber") as string,
    address: formData.get("address") as string,
    services: formData.get("services") as string,
    paymentTerms: formData.get("paymentTerms") as string,
    outstandingBal: parseFloat(formData.get("outstandingBal") as string) || 0,
  };

  await prisma.erpVendor.create({ data });
  revalidatePath("/erp/vendors");
  redirect("/erp/vendors");
}
