
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

export async function createAsset(formData: FormData) {
  await requireAuth();

  const purchaseDateStr = formData.get("purchaseDate") as string;
  const warrantyEndStr = formData.get("warrantyEnd") as string;
  const assignedToId = formData.get("assignedToId") as string;

  const data = {
    assetId: formData.get("assetId") as string,
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    purchaseDate: new Date(purchaseDateStr),
    purchaseCost: parseFloat(formData.get("purchaseCost") as string) || 0,
    warrantyEnd: warrantyEndStr ? new Date(warrantyEndStr) : null,
    assignedToId: assignedToId || null,
    status: formData.get("status") as string || "ACTIVE",
    maintenanceHistory: formData.get("maintenanceHistory") as string || "",
  };

  await prisma.erpAsset.create({ data });
  revalidatePath("/erp/assets");
  redirect("/erp/assets");
}
