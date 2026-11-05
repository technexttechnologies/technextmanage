export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSession, isTestSession } from "@/lib/auth";
import TechNextDocumentTemplate, { 
  BillingDocumentData, 
  BillingDocType 
} from "@/components/billing/TechNextDocumentTemplate";

export default async function BillingDocumentViewerPage({
  params
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const session = await getSession();
  const isTestUser = isTestSession(session);

  const { type, id } = await params;
  const normalizedType = type.toLowerCase();

  if (normalizedType === "quotation") {
    let quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { orderBy: { id: "asc" } },
        terms: { orderBy: { order: "asc" } }
      }
    });

    if (!quotation) {
      quotation = await prisma.quotation.findFirst({
        where: { quotationNumber: id },
        include: {
          customer: true,
          items: { orderBy: { id: "asc" } },
          terms: { orderBy: { order: "asc" } }
        }
      });
    }

    if (!quotation) return notFound();

    const docData: BillingDocumentData = {
      id: quotation.id,
      documentType: "QUOTATION",
      documentNumber: quotation.quotationNumber,
      date: quotation.date,
      dueDate: quotation.expiryDate || quotation.date,
      paymentStatus: quotation.status === "APPROVED" || quotation.status === "CONVERTED" ? "Paid" : "Pending",
      paymentMethod: "UPI PAYMENT",
      bankDetails: "SOUTH INDIAN BANK\nPULPALLY",
      customer: {
        id: quotation.customer.id,
        name: quotation.customer.name,
        company: quotation.companyName || quotation.customer.company,
        address: quotation.companyAddress || quotation.customer.address,
        phone: quotation.customer.phone,
        email: quotation.customer.email,
        customerNumber: quotation.customer.customerNumber,
        aroniumCode: quotation.customer.aroniumCode,
        gstNumber: quotation.companyGst || quotation.customer.gstNumber,
        portalToken: quotation.customer.portalToken,
      },
      items: quotation.items.map(it => ({
        id: it.id,
        name: it.name,
        description: it.description || undefined,
        quantity: it.quantity,
        unitPrice: it.price,
        tax: "---",
        discount: "---",
        total: it.total,
      })),
      subtotal: quotation.subtotal || quotation.totalAmount,
      totalDiscount: 0,
      totalAmount: quotation.totalAmount,
      paidAmount: quotation.status === "APPROVED" ? quotation.totalAmount : 0,
      amountDue: quotation.status === "APPROVED" ? 0 : quotation.totalAmount,
      scopeOfWork: quotation.notes || "Quotation for provided services and digital solutions.",
      paymentTermsNote: "Payment Terms: 50% advance upon order confirmation, balance on delivery.",
      terms: quotation.terms.map(t => t.content),
      hideCompanyDetails: isTestUser
    };

    return <TechNextDocumentTemplate data={docData} backUrl="/billing" />;
  }

  // Invoice, Order Form, or Payment Receipt from InvoiceRequest
  let invoice = await prisma.invoiceRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
    }
  });

  if (!invoice) {
    invoice = await prisma.invoiceRequest.findFirst({
      where: { aroniumInvoiceNo: id },
      include: {
        customer: true,
        project: true,
      }
    });
  }

  if (!invoice) return notFound();

  const structured = (invoice.structuredData as any) || {};

  // Infer document type from url param or structuredData
  let resolvedDocType: BillingDocType = "INVOICE";
  if (normalizedType.includes("order")) resolvedDocType = "ORDER_FORM";
  else if (normalizedType.includes("payment") || normalizedType.includes("receipt")) resolvedDocType = "PAYMENT_RECEIPT";
  else if (normalizedType.includes("refund")) resolvedDocType = "REFUND";
  else if (structured.documentType) resolvedDocType = structured.documentType;

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
  const calculatedTotal = structured.totalAmount !== undefined ? structured.totalAmount : invoice.amountRequested;
  const calculatedPaid = structured.paidAmount !== undefined 
    ? structured.paidAmount 
    : isPaid 
    ? calculatedTotal 
    : 0;
  const calculatedDue = structured.amountDue !== undefined 
    ? structured.amountDue 
    : Math.max(0, calculatedTotal - calculatedPaid);

  const docData: BillingDocumentData = {
    id: invoice.id,
    documentType: resolvedDocType,
    documentNumber: structured.documentNumber || invoice.aroniumInvoiceNo || `26-200-${invoice.id.slice(-6).toUpperCase()}`,
    date: structured.date || invoice.createdAt,
    dueDate: structured.dueDate || invoice.createdAt,
    paymentStatus: isPaid ? "Paid" : structured.paymentStatus || "Pending",
    paymentMethod: structured.paymentMethod || "UPI PAYMENT",
    paymentType: structured.paymentType,
    paymentSchedule: structured.paymentSchedule || [],
    splitBreakdown: structured.splitBreakdown,
    creditDueDate: structured.creditDueDate,
    creditTerms: structured.creditTerms,
    bankDetails: structured.bankDetails || "SOUTH INDIAN BANK\nPULPALLY",
    customer: {
      id: invoice.customer.id,
      name: structured.customerName || invoice.customer.name,
      company: structured.customerCompany || invoice.customer.company,
      address: structured.customerAddress || invoice.customer.address,
      phone: structured.customerPhone || invoice.customer.phone,
      email: structured.customerEmail || invoice.customer.email,
      customerNumber: invoice.customer.customerNumber,
      aroniumCode: invoice.customer.aroniumCode,
      gstNumber: structured.customerGst || invoice.customer.gstNumber,
      portalToken: invoice.customer.portalToken,
    },
    items,
    subtotal: structured.subtotal !== undefined ? structured.subtotal : invoice.subtotal || invoice.amountRequested,
    totalDiscount: structured.totalDiscount || 0,
    totalAmount: calculatedTotal,
    paidAmount: calculatedPaid,
    amountDue: calculatedDue,
    scopeOfWork: structured.scopeOfWork || invoice.notes || "The invoice covers the agreed website development scope, including website design, development, responsive optimization, basic functionality, deployment, and related configuration as discussed with the client.",
    paymentTermsNote: structured.paymentTermsNote || "Payment Terms: Payment is due as per the agreed quotation/payment schedule. Any additional features, revisions, third-party services, domain, hosting, or other requirements outside the agreed scope may be charged separately.",
    hideCompanyDetails: isTestUser,
  };

  return <TechNextDocumentTemplate data={docData} backUrl="/billing" />;
}
