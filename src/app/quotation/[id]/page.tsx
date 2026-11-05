export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSession, isTestSession } from "@/lib/auth";
import TechNextDocumentTemplate, { 
  BillingDocumentData 
} from "@/components/billing/TechNextDocumentTemplate";
import { QuotationApprovalButtons } from "./QuotationApprovalButtons";

export default async function DynamicQuotationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getSession();
  const isTestUser = isTestSession(session);

  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { id: "asc" } },
      terms: { orderBy: { order: "asc" } },
      milestones: { orderBy: { order: "asc" } },
    }
  });

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
    scopeOfWork: quotation.notes || "Quotation covers the agreed solution scope, software architecture, responsive optimization, deployment, and ongoing technical support.",
    paymentTermsNote: "Payment Terms: 50% advance upon order confirmation, balance due upon project delivery and handover.",
    terms: quotation.terms.map(t => t.content),
    hideCompanyDetails: isTestUser,
  };

  return (
    <div>
      <TechNextDocumentTemplate 
        data={docData} 
        backUrl="/billing"
        showTypeSwitcher={true}
        showActionButtons={true}
      />
      {quotation.status !== "APPROVED" && quotation.status !== "CONVERTED" && (
        <div style={{ maxWidth: "860px", margin: "-20px auto 40px auto", padding: "16px 24px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "center", gap: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <QuotationApprovalButtons quotationId={quotation.id} currentStatus={quotation.status} />
        </div>
      )}
    </div>
  );
}
