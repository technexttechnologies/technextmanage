export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TechNextDocumentTemplate, { 
  BillingDocumentData 
} from "@/components/billing/TechNextDocumentTemplate";

export default async function DynamicInvoiceRequestPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
    }
  });

  if (!invoice) return notFound();

  const structured = (invoice.structuredData as any) || {};

  // Build items array
  let items = structured.items && Array.isArray(structured.items) ? structured.items : [];
  if (items.length === 0) {
    items = [
      {
        name: invoice.project ? invoice.project.name : "Professional Tech Services",
        description: invoice.notes || "Official professional services & software development.",
        quantity: 1,
        unitPrice: invoice.amountRequested,
        tax: "---",
        discount: "---",
        total: invoice.amountRequested,
      }
    ];
  }

  const isPaid = invoice.status === "PAID" || structured.paymentStatus === "Paid";

  const docData: BillingDocumentData = {
    id: invoice.id,
    documentType: "INVOICE",
    documentNumber: structured.documentNumber || invoice.aroniumInvoiceNo || `26-200-${invoice.id.slice(-6).toUpperCase()}`,
    date: structured.date || invoice.createdAt,
    dueDate: structured.dueDate || invoice.createdAt,
    paymentStatus: isPaid ? "Paid" : "Pending",
    paymentMethod: structured.paymentMethod || "UPI PAYMENT",
    bankDetails: structured.bankDetails || "SOUTH INDIAN BANK\nPULPALLY",
    customer: {
      id: invoice.customer.id,
      name: invoice.customer.name,
      company: invoice.customer.company,
      address: invoice.customer.address,
      phone: invoice.customer.phone,
      email: invoice.customer.email,
      customerNumber: invoice.customer.customerNumber,
      aroniumCode: invoice.customer.aroniumCode,
      gstNumber: invoice.customer.gstNumber,
    },
    items,
    subtotal: structured.subtotal !== undefined ? structured.subtotal : invoice.subtotal || invoice.amountRequested,
    totalDiscount: structured.totalDiscount || 0,
    totalAmount: structured.totalAmount || invoice.amountRequested,
    paidAmount: isPaid ? (structured.paidAmount || invoice.amountRequested) : 0,
    amountDue: isPaid ? 0 : (structured.amountDue || invoice.amountRequested),
    scopeOfWork: structured.scopeOfWork || invoice.notes || "The invoice covers the agreed website development scope, including website design, development, responsive optimization, basic functionality, deployment, and related configuration as discussed with the client.",
    paymentTermsNote: structured.paymentTermsNote || "Payment Terms: Payment is due as per the agreed quotation/payment schedule. Any additional features, revisions, third-party services, domain, hosting, or other requirements outside the agreed scope may be charged separately.",
  };

  return (
    <TechNextDocumentTemplate 
      data={docData} 
      backUrl="/billing"
      showTypeSwitcher={true}
      showActionButtons={true} 
    />
  );
}
