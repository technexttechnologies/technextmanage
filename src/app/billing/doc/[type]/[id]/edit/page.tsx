export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import styles from "@/app/billing/page.module.css";
import BillingDocumentForm from "@/app/billing/new/BillingDocumentForm";

export default async function EditBillingDocumentPage({
  params
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const normalizedType = type.toLowerCase();

  const [customers, products, allProjects] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { projects: true }
    }),
    prisma.erpProduct.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: { 
        id: true, 
        name: true, 
        status: true, 
        customerId: true, 
        type: true, 
        estimatedBudget: true, 
        customer: { select: { id: true, name: true } } 
      }
    })
  ]);

  if (normalizedType === "quotation") {
    let quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true }
    });

    if (!quotation) {
      quotation = await prisma.quotation.findFirst({
        where: { quotationNumber: id },
        include: { customer: true, items: true }
      });
    }

    if (!quotation) return notFound();

    const initialDocument = {
      id: quotation.id,
      documentType: "QUOTATION",
      documentNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customerName: quotation.companyName || quotation.customer?.name || "",
      customerCompany: quotation.companyName || quotation.customer?.company || "",
      customerPhone: quotation.customer?.phone || "",
      customerEmail: quotation.customer?.email || "",
      customerAddress: quotation.companyAddress || quotation.customer?.address || "",
      customerGst: quotation.companyGst || quotation.customer?.gstNumber || "",
      date: quotation.date,
      dueDate: quotation.expiryDate || quotation.date,
      paymentStatus: quotation.status === "APPROVED" || quotation.status === "CONVERTED" ? "Paid" : "Pending",
      paymentMethod: "UPI PAYMENT",
      bankDetails: "SOUTH INDIAN BANK\nPULPALLY",
      items: quotation.items.map(it => ({
        id: it.id,
        name: it.name,
        description: it.description || "",
        quantity: it.quantity,
        unitPrice: it.price,
        tax: "---",
        discount: "---",
        total: it.total,
      })),
      subtotal: quotation.subtotal,
      totalDiscount: 0,
      totalAmount: quotation.totalAmount,
      scopeOfWork: quotation.notes || "",
      paymentTermsNote: "Payment Terms: 50% advance upon order confirmation, balance on delivery.",
    };

    return (
      <div className={styles.container}>
        <Link 
          href={`/billing/doc/quotation/${quotation.id}`} 
          className="btn-secondary" 
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "6px 12px", background: "transparent", border: "none" }}
        >
          <ArrowLeft size={16} /> Back to Quotation
        </Link>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Edit3 size={28} color="#4F46E5" />
              Edit Quotation: {quotation.quotationNumber}
            </h1>
            <p className={styles.subtitle}>
              Modify items, rates, customer details, or terms for this proposal.
            </p>
          </div>
        </header>

        <div className={styles.card}>
          <BillingDocumentForm 
            customers={customers} 
            products={products}
            allProjects={allProjects}
            defaultType="quotation"
            initialDocument={initialDocument}
            isEdit={true}
          />
        </div>
      </div>
    );
  }

  // Invoice, Order Form, or Payment Receipt
  let invoice = await prisma.invoiceRequest.findUnique({
    where: { id },
    include: { customer: true, project: true }
  });

  if (!invoice) {
    invoice = await prisma.invoiceRequest.findFirst({
      where: { aroniumInvoiceNo: id },
      include: { customer: true, project: true }
    });
  }

  if (!invoice) return notFound();

  const sData = (invoice.structuredData as any) || {};

  const initialDocument = {
    id: invoice.id,
    documentType: sData.documentType || (invoice.aroniumInvoiceNo?.includes("ORD") ? "ORDER_FORM" : invoice.aroniumInvoiceNo?.includes("REC") ? "PAYMENT_RECEIPT" : "INVOICE"),
    documentNumber: sData.documentNumber || invoice.aroniumInvoiceNo || `26-200-${invoice.id.slice(-6).toUpperCase()}`,
    customerId: invoice.customerId,
    customerName: sData.customerName || invoice.customer?.name || "",
    customerCompany: sData.customerCompany || invoice.customer?.company || "",
    customerPhone: sData.customerPhone || invoice.customer?.phone || "",
    customerEmail: sData.customerEmail || invoice.customer?.email || "",
    customerAddress: sData.customerAddress || invoice.customer?.address || "",
    customerGst: sData.customerGst || invoice.customer?.gstNumber || "",
    projectId: invoice.projectId,
    date: sData.date || invoice.createdAt,
    dueDate: sData.dueDate || invoice.createdAt,
    paymentType: sData.paymentType || (sData.paymentMethod?.includes("SPLIT") ? "SPLIT" : sData.paymentMethod?.includes("CREDIT") ? "CREDIT" : "FULL"),
    paymentStatus: sData.paymentStatus || (invoice.status === "PAID" ? "Paid" : "Pending"),
    paymentMethod: sData.paymentMethod || "UPI PAYMENT",
    paymentSchedule: sData.paymentSchedule,
    splitBreakdown: sData.splitBreakdown,
    creditDueDate: sData.creditDueDate,
    creditTerms: sData.creditTerms,
    bankDetails: sData.bankDetails || "SOUTH INDIAN BANK\nPULPALLY",
    items: sData.items || [
      {
        name: invoice.project ? invoice.project.name : "Professional Tech Services",
        description: invoice.notes || "",
        quantity: 1,
        unitPrice: invoice.amountRequested,
        tax: "---",
        discount: "---",
        total: invoice.amountRequested,
      }
    ],
    subtotal: sData.subtotal !== undefined ? sData.subtotal : invoice.subtotal || invoice.amountRequested,
    totalDiscount: sData.totalDiscount || 0,
    totalAmount: sData.totalAmount || invoice.amountRequested,
    scopeOfWork: sData.scopeOfWork || invoice.notes || "",
    paymentTermsNote: sData.paymentTermsNote || "",
  };

  return (
    <div className={styles.container}>
      <Link 
        href={`/billing/doc/${type}/${invoice.id}`} 
        className="btn-secondary" 
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "6px 12px", background: "transparent", border: "none" }}
      >
        <ArrowLeft size={16} /> Back to Document
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Edit3 size={28} color="#4F46E5" />
            Edit Document: {initialDocument.documentNumber}
          </h1>
          <p className={styles.subtitle}>
            Update line items, prices, discounts, split payment, or credit terms.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <BillingDocumentForm 
          customers={customers} 
          products={products}
          allProjects={allProjects}
          defaultType={type}
          initialDocument={initialDocument}
          isEdit={true}
        />
      </div>
    </div>
  );
}
