'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAroniumConfig(formData: FormData) {
  const companyName = formData.get("companyName")?.toString() || "";
  const branchName = formData.get("branchName")?.toString() || "";
  const dbType = formData.get("dbType")?.toString() || "SQLITE";
  const dbPathOrHost = formData.get("dbPathOrHost")?.toString() || "";
  const portString = formData.get("port")?.toString();
  const port = portString ? parseInt(portString, 10) : null;
  const username = formData.get("username")?.toString() || null;
  const password = formData.get("password")?.toString() || null;
  const autoSync = formData.get("autoSync") === "on" || formData.get("autoSync") === "true";

  // Find the first configuration
  const existingConfig = await prisma.aroniumConfig.findFirst();

  if (existingConfig) {
    await prisma.aroniumConfig.update({
      where: { id: existingConfig.id },
      data: {
        companyName,
        branchName,
        dbType,
        dbPathOrHost,
        port,
        username,
        password,
        autoSync,
        status: "ONLINE", // Assuming setting it up sets status to ONLINE temporarily
      },
    });
  } else {
    await prisma.aroniumConfig.create({
      data: {
        companyName,
        branchName,
        dbType,
        dbPathOrHost,
        port,
        username,
        password,
        autoSync,
        status: "ONLINE",
      },
    });
  }

  revalidatePath("/erp/integrations/aronium");
}
