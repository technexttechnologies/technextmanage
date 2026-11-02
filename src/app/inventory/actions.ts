"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Please log in to manage inventory.");
  }

  const name = formData.get("name") as string;
  const sku = (formData.get("sku") as string) || null;
  const barcode = (formData.get("barcode") as string) || null;
  const category = (formData.get("category") as string) || "General";
  const brand = (formData.get("brand") as string) || null;
  const unit = (formData.get("unit") as string) || "Pcs";
  const hsnCode = (formData.get("hsnCode") as string) || null;
  const description = (formData.get("description") as string) || null;
  const location = (formData.get("location") as string) || null;

  const purchasePrice = parseFloat((formData.get("purchasePrice") as string) || "0");
  const sellingPrice = parseFloat((formData.get("sellingPrice") as string) || "0");
  const initialStock = parseFloat((formData.get("currentStock") as string) || "0");
  const reorderLevel = parseFloat((formData.get("reorderLevel") as string) || "5");
  const taxRate = parseFloat((formData.get("taxRate") as string) || "18");

  if (!name || isNaN(purchasePrice) || isNaN(sellingPrice)) {
    throw new Error("Product Name, Cost Price, and Selling Price are required.");
  }

  const isLowStock = initialStock <= reorderLevel;

  const product = await prisma.erpProduct.create({
    data: {
      name,
      sku,
      barcode,
      category,
      brand,
      unit,
      hsnCode,
      taxRate,
      description,
      location,
      purchasePrice,
      sellingPrice,
      currentStock: initialStock,
      reorderLevel,
      isLowStock,
    },
  });

  // Record initial stock movement if > 0
  if (initialStock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        reason: "Initial Stock on creation",
        referenceNo: "INIT-STOCK",
        createdById: session.userId,
      },
    });
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/inventory/reports");
  revalidatePath("/erp/integrations/aronium");
  redirect("/inventory");
}

export async function updateProduct(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const sku = (formData.get("sku") as string) || null;
  const barcode = (formData.get("barcode") as string) || null;
  const category = (formData.get("category") as string) || "General";
  const brand = (formData.get("brand") as string) || null;
  const unit = (formData.get("unit") as string) || "Pcs";
  const hsnCode = (formData.get("hsnCode") as string) || null;
  const description = (formData.get("description") as string) || null;
  const location = (formData.get("location") as string) || null;

  const purchasePrice = parseFloat((formData.get("purchasePrice") as string) || "0");
  const sellingPrice = parseFloat((formData.get("sellingPrice") as string) || "0");
  const reorderLevel = parseFloat((formData.get("reorderLevel") as string) || "5");
  const taxRate = parseFloat((formData.get("taxRate") as string) || "18");

  const existing = await prisma.erpProduct.findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found");

  const isLowStock = existing.currentStock <= reorderLevel;

  await prisma.erpProduct.update({
    where: { id },
    data: {
      name,
      sku,
      barcode,
      category,
      brand,
      unit,
      hsnCode,
      taxRate,
      description,
      location,
      purchasePrice,
      sellingPrice,
      reorderLevel,
      isLowStock,
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/inventory/reports");
  redirect(`/inventory/${id}`);
}

export async function adjustStock(
  productId: string,
  type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE",
  quantity: number,
  reason: string,
  referenceNo?: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Please log in to adjust stock.");
  }

  const product = await prisma.erpProduct.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const previousStock = product.currentStock;
  let newStock = previousStock;

  if (type === "IN") {
    newStock = previousStock + Math.abs(quantity);
  } else if (type === "OUT" || type === "DAMAGE") {
    newStock = Math.max(0, previousStock - Math.abs(quantity));
  } else if (type === "ADJUSTMENT") {
    newStock = Math.max(0, quantity); // direct set
  }

  const isLowStock = newStock <= product.reorderLevel;

  // Update product stock
  await prisma.erpProduct.update({
    where: { id: productId },
    data: {
      currentStock: newStock,
      isLowStock,
    },
  });

  // Create audit trail
  const movement = await prisma.stockMovement.create({
    data: {
      productId,
      type,
      quantity: type === "ADJUSTMENT" ? Math.abs(newStock - previousStock) : Math.abs(quantity),
      previousStock,
      newStock,
      reason: reason || "Stock adjusted via Inventory Manager",
      referenceNo: referenceNo || `ADJ-${Date.now().toString().slice(-6)}`,
      createdById: session.userId,
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  revalidatePath("/inventory/movements");
  revalidatePath("/inventory/reports");

  return { success: true, movement, newStock };
}

export async function deleteProduct(productId: string) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only administrators can delete products.");
  }

  await prisma.erpProduct.delete({
    where: { id: productId },
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/reports");
  redirect("/inventory");
}
