export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AroniumBillingConsole from "./AroniumBillingConsole";

export default async function BillingHubPage() {
  const [invoices, quotations, products, customers, users, projects] = await Promise.all([
    prisma.invoiceRequest.findMany({
      include: {
        customer: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quotation.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.erpProduct.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, sellingPrice: true, purchasePrice: true, category: true, isService: true }
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true, customerNumber: true, aroniumCode: true, phone: true }
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true }
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: { 
        id: true, 
        name: true, 
        status: true, 
        type: true, 
        estimatedBudget: true, 
        customerId: true, 
        customer: { select: { id: true, name: true } } 
      }
    })
  ]);

  // Financial Metrics
  const totalBilled = invoices.reduce((sum, inv) => {
    const sData = (inv.structuredData as any) || {};
    return sum + (sData.totalAmount || inv.amountRequested || 0);
  }, 0);

  const totalCollected = invoices.reduce((sum, inv) => {
    const sData = (inv.structuredData as any) || {};
    const isPaid = inv.status === "PAID" || sData.paymentStatus === "Paid";
    return sum + (isPaid ? (sData.paidAmount || sData.totalAmount || inv.amountRequested || 0) : 0);
  }, 0);

  const totalDue = Math.max(0, totalBilled - totalCollected);

  const activeQuotes = quotations.filter(
    q => q.status !== "REJECTED" && q.status !== "CONVERTED"
  ).length;

  return (
    <AroniumBillingConsole 
      invoices={invoices} 
      quotations={quotations}
      products={products}
      customers={customers}
      users={users}
      projects={projects}
      metrics={{ totalBilled, totalCollected, totalDue, activeQuotes }} 
    />
  );
}
