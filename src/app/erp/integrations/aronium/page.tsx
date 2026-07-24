import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AroniumDashboardClient from './AroniumDashboardClient';

export const dynamic = 'force-dynamic'; // Ensure fresh stats

export default async function AroniumDashboardPage() {
  const config = await prisma.aroniumConfig.findFirst();

  if (!config) {
    redirect('/erp/integrations/aronium/setup');
  }

  // Fetch widgets data
  const [totalSales, totalProducts, lowStockItems, products, sales, purchases] = await Promise.all([
    prisma.erpSale.count(),
    prisma.erpProduct.count(),
    prisma.erpProduct.count({ where: { isLowStock: true } }),
    prisma.erpProduct.findMany({ orderBy: { name: 'asc' } }),
    prisma.erpSale.findMany({ orderBy: { date: 'desc' } }),
    prisma.erpPurchase.findMany({ orderBy: { date: 'desc' } })
  ]);

  const totalCustomers = config.totalCustomers;

  return (
    <AroniumDashboardClient
      config={config}
      totalSales={totalSales}
      totalProducts={totalProducts}
      lowStockItems={lowStockItems}
      totalCustomers={totalCustomers}
      products={products}
      sales={sales}
      purchases={purchases}
    />
  );
}
