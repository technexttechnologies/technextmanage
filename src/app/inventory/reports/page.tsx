export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InventoryReportsClient } from "./InventoryReportsClient";

export const metadata = {
  title: "Inventory Reports & Valuation | TechNext ERP",
  description: "Detailed inventory asset valuation, stock replenishment deficits, and category reports.",
};

export default async function InventoryReportsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const products = await prisma.erpProduct.findMany({
    orderBy: { name: "asc" },
  });

  const totalItems = products.length;
  const totalUnits = products.reduce((acc, p) => acc + Math.max(0, p.currentStock), 0);
  const valuationCost = products.reduce((acc, p) => acc + Math.max(0, p.currentStock * p.purchasePrice), 0);
  const valuationRetail = products.reduce((acc, p) => acc + Math.max(0, p.currentStock * p.sellingPrice), 0);
  const potentialProfit = valuationRetail - valuationCost;
  const marginPercent = valuationRetail > 0 ? ((potentialProfit / valuationRetail) * 100).toFixed(1) : "0";
  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderLevel).length;

  // Category breakdown
  const categoryMap = new Map<string, { count: number; units: number; costValuation: number; retailValuation: number }>();

  for (const p of products) {
    const cat = p.category || "General";
    const current = categoryMap.get(cat) || { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
    current.count += 1;
    current.units += Math.max(0, p.currentStock);
    current.costValuation += Math.max(0, p.currentStock * p.purchasePrice);
    current.retailValuation += Math.max(0, p.currentStock * p.sellingPrice);
    categoryMap.set(cat, current);
  }

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    ...val,
  })).sort((a, b) => b.costValuation - a.costValuation);

  return (
    <InventoryReportsClient
      products={products}
      stats={{
        totalItems,
        totalUnits,
        valuationCost,
        valuationRetail,
        potentialProfit,
        marginPercent,
        lowStockCount,
      }}
      categoryBreakdown={categoryBreakdown}
    />
  );
}
