export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession, isTestSession } from "@/lib/auth";
import AroniumBillingConsole from "./AroniumBillingConsole";

export default async function BillingHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; [key: string]: string | undefined }> | { tab?: string; [key: string]: string | undefined };
}) {
  const session = await getSession();
  const isTestUser = isTestSession(session);

  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
  const rawTab = (resolvedParams.tab?.toUpperCase() || "DOCUMENTS") as any;
  const initialTab = ["DOCUMENTS", "REPORTING", "DASHBOARD", "PRODUCTS"].includes(rawTab) ? rawTab : "DOCUMENTS";

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
      select: { 
        id: true, 
        aroniumId: true,
        name: true, 
        sku: true, 
        barcode: true,
        sellingPrice: true, 
        purchasePrice: true, 
        category: true, 
        unit: true,
        taxRate: true,
        currentStock: true,
        isService: true 
      }
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

  const sanitizedCustomers = isTestUser
    ? customers.map(c => ({ ...c, company: null }))
    : customers;

  const sanitizedQuotations = isTestUser
    ? quotations.map(q => ({
        ...q,
        companyName: null,
        customer: q.customer ? { ...q.customer, company: null } : q.customer
      }))
    : quotations;

  const sanitizedInvoices = isTestUser
    ? invoices.map(inv => ({
        ...inv,
        customer: inv.customer ? { ...inv.customer, company: null } : inv.customer
      }))
    : invoices;

  return (
    <AroniumBillingConsole 
      invoices={sanitizedInvoices} 
      quotations={sanitizedQuotations}
      products={products}
      customers={sanitizedCustomers}
      users={users}
      projects={projects}
      metrics={{ totalBilled, totalCollected, totalDue, activeQuotes }}
      initialTab={initialTab}
      isTestUser={isTestUser}
    />
  );
}
