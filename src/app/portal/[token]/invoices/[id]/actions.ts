"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reportInvoicePayment(invoiceId: string, token: string) {
  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id: invoiceId },
    include: { customer: true }
  });

  if (!invoice || invoice.customer.portalToken !== token) {
    throw new Error("Invoice not found or unauthorized");
  }

  if (invoice.status === 'PAID') {
    throw new Error("Invoice is already paid");
  }

  await prisma.invoiceRequest.update({
    where: { id: invoiceId },
    data: { status: "UNDER_REVIEW", notes: invoice.notes ? invoice.notes + "\n\n[Customer reported payment made. Awaiting admin verification.]" : "[Customer reported payment made. Awaiting admin verification.]" }
  });

  // Admin user to assign log to
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  if (admin) {
    await prisma.activityLog.create({
      data: {
        action: "PAYMENT_REPORTED",
        entityType: "INVOICE_REQUEST",
        entityId: invoice.id,
        details: `Customer ${invoice.customer.name} reported payment for invoice ${invoice.aroniumInvoiceNo || invoice.id.slice(-6).toUpperCase()}`,
        userId: admin.id
      }
    });
  }

  revalidatePath(`/portal/${token}/invoices/${invoiceId}`);
  revalidatePath(`/portal/${token}`);
  revalidatePath(`/invoice-requests/${invoiceId}`);
}
