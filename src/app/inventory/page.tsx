export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InventoryClient } from "./InventoryClient";

export const metadata = {
  title: "Inventory & Stock Management | TechNext ERP",
  description: "Enterprise Inventory Management with real-time stock levels, valuations, and audit movements.",
};

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const products = await prisma.erpProduct.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const stats = {
    totalItems: products.length,
    totalUnits: products.reduce((acc, p) => acc + Math.max(0, p.currentStock), 0),
    valuationCost: products.reduce((acc, p) => acc + Math.max(0, p.currentStock * p.purchasePrice), 0),
    valuationRetail: products.reduce((acc, p) => acc + Math.max(0, p.currentStock * p.sellingPrice), 0),
    lowStockCount: products.filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel).length,
    outOfStockCount: products.filter((p) => p.currentStock <= 0).length,
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <InventoryClient 
      products={products} 
      stats={stats} 
      categories={categories} 
    />
  );
}
