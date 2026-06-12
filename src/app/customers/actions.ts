"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createCustomer(formData: FormData) {
  // Hardcode assignment for now until auth is added
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: "admin@technext.com",
        name: "Admin User",
        passwordHash: "dummy",
        role: "SUPER_ADMIN"
      }
    });
  }

  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const status = formData.get("status") as string || "LEAD";
  const address = formData.get("address") as string;
  const gstNumber = formData.get("gstNumber") as string;
  const notes = formData.get("notes") as string;

  await prisma.customer.create({
    data: {
      name,
      company,
      phone,
      email,
      status,
      address,
      gstNumber,
      notes,
      assignedToId: adminUser.id,
    }
  });

  redirect("/customers");
}
