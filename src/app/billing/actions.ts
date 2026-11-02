"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  sendWhatsAppNotification, 
  buildInvoiceNotificationMessage, 
  getAppUrl 
} from "@/lib/whatsapp";

export async function createBillingDocument(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const documentType = (formData.get("documentType") as string) || "INVOICE";
  const customerId = formData.get("customerId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const documentNumber = formData.get("documentNumber") as string;
  const dateStr = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const dueDateStr = (formData.get("dueDate") as string) || dateStr;
  const paymentStatus = (formData.get("paymentStatus") as string) || "Paid";
  const paymentMethod = (formData.get("paymentMethod") as string) || "UPI PAYMENT";
  const bankDetails = (formData.get("bankDetails") as string) || "SOUTH INDIAN BANK\nPULPALLY";
  
  const subtotal = parseFloat((formData.get("subtotal") as string) || "0");
  const totalDiscount = parseFloat((formData.get("totalDiscount") as string) || "0");
  const totalAmount = parseFloat((formData.get("totalAmount") as string) || "0");
  const paidAmount = parseFloat((formData.get("paidAmount") as string) || "0");
  const amountDue = parseFloat((formData.get("amountDue") as string) || "0");

  const scopeOfWork = (formData.get("scopeOfWork") as string) || "";
  const paymentTermsNote = (formData.get("paymentTermsNote") as string) || "";
  const notes = (formData.get("notes") as string) || "";

  const itemsJson = formData.get("itemsJson") as string;
  let items: any[] = [];
  if (itemsJson) {
    try {
      items = JSON.parse(itemsJson);
    } catch {
      items = [];
    }
  }

  if (!customerId || isNaN(totalAmount)) {
    throw new Error("Missing customer or total amount");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  if (!customer) throw new Error("Customer not found");

  let createdId = "";

  if (documentType === "QUOTATION") {
    // Save as Quotation in the CRM
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: documentNumber,
        customerId,
        date: new Date(dateStr),
        expiryDate: new Date(dueDateStr),
        totalAmount,
        subtotal,
        status: paymentStatus === "Paid" ? "APPROVED" : "SENT",
        notes: scopeOfWork || notes,
        companyName: customer.company || customer.name,
        companyAddress: customer.address,
        companyGst: customer.gstNumber,
        assignedToId: session.userId as string,
        items: {
          create: items.map(it => ({
            name: it.name,
            description: it.description || null,
            quantity: Number(it.quantity) || 1,
            price: Number(it.unitPrice) || 0,
            total: Number(it.total) || 0,
          }))
        }
      }
    });

    createdId = quotation.id;

    await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entityType: "QUOTATION",
        entityId: quotation.id,
        userId: session.userId as string,
        details: `Created Quotation #${documentNumber} for ${customer.name}`
      }
    });
  } else {
    // INVOICE, ORDER_FORM, or PAYMENT_RECEIPT
    const structuredPayload = {
      documentType,
      documentNumber,
      date: dateStr,
      dueDate: dueDateStr,
      paymentStatus,
      paymentMethod,
      bankDetails,
      items,
      subtotal,
      totalDiscount,
      totalAmount,
      paidAmount,
      amountDue,
      scopeOfWork,
      paymentTermsNote,
      stockDeducted: paymentStatus === "Paid"
    };

    const status = paymentStatus === "Paid" 
      ? "PAID" 
      : documentType === "ORDER_FORM" 
      ? "APPROVED" 
      : "INVOICE_GENERATED";

    const invoice = await prisma.invoiceRequest.create({
      data: {
        customerId,
        projectId,
        subtotal,
        gstPercentage: 0,
        amountRequested: totalAmount,
        notes: scopeOfWork || notes,
        status,
        aroniumInvoiceNo: documentNumber,
        structuredData: structuredPayload,
        requestedById: session.userId as string,
        assignedAdminId: session.userId as string,
      }
    });

    createdId = invoice.id;

    // Deduct stock if Paid
    if (paymentStatus === "Paid" && items.length > 0) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          const product = await prisma.erpProduct.findUnique({
            where: { id: item.productId }
          });
          if (product) {
            const prevStock = product.currentStock;
            const newStock = Math.max(0, prevStock - item.quantity);
            await prisma.erpProduct.update({
              where: { id: item.productId },
              data: { currentStock: newStock }
            });
            await prisma.stockMovement.create({
              data: {
                productId: item.productId,
                type: "OUT",
                quantity: item.quantity,
                previousStock: prevStock,
                newStock,
                reason: `${documentType} #${documentNumber} Paid / Fulfilled`,
                referenceNo: documentNumber,
                createdById: session.userId as string
              }
            });
          }
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entityType: "INVOICE_REQUEST",
        entityId: invoice.id,
        userId: session.userId as string,
        details: `Generated ${documentType} #${documentNumber} for ${customer.name}`
      }
    });

    // Send WhatsApp notification if customer phone exists
    if (customer.phone) {
      try {
        const trackingUrl = `${getAppUrl()}/billing/doc/${documentType.toLowerCase()}/${invoice.id}`;
        const waMsg = buildInvoiceNotificationMessage({
          customerName: customer.name,
          invoiceNo: documentNumber,
          amount: totalAmount,
          trackingUrl,
        });
        await sendWhatsAppNotification({
          phone: customer.phone,
          recipientName: customer.name,
          message: waMsg,
          triggerType: "INVOICE",
          customerId: customer.id,
        });
      } catch (waErr) {
        console.error("[Billing WhatsApp Error]", waErr);
      }
    }
  }

  revalidatePath("/billing");
  revalidatePath("/invoice-requests");
  revalidatePath("/quotations");
  revalidatePath("/inventory");

  redirect(`/billing/doc/${documentType.toLowerCase()}/${createdId}`);
}

export async function deleteBillingDocument(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only admins can delete billing documents");
  }

  const id = formData.get("id") as string;
  const type = formData.get("type") as string;

  if (type === "quotation") {
    await prisma.quotation.delete({ where: { id } });
  } else {
    await prisma.invoiceRequest.delete({ where: { id } });
  }

  revalidatePath("/billing");
  revalidatePath("/invoice-requests");
  revalidatePath("/quotations");
  redirect("/billing");
}

export async function convertQuotationToInvoice(quotationId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { customer: true, items: true }
  });

  if (!quote) throw new Error("Quotation not found");

  const invNumber = `26-200-${Math.floor(100000 + Math.random() * 900000)}`;

  const items = quote.items.map(it => ({
    name: it.name,
    description: it.description || "",
    quantity: it.quantity,
    unitPrice: it.price,
    tax: "---",
    discount: "---",
    total: it.total
  }));

  const structuredPayload = {
    documentType: "INVOICE",
    documentNumber: invNumber,
    date: new Date().toISOString().split("T")[0],
    dueDate: quote.expiryDate ? new Date(quote.expiryDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    paymentStatus: "Pending",
    paymentMethod: "UPI PAYMENT",
    bankDetails: "SOUTH INDIAN BANK\nPULPALLY",
    items,
    subtotal: quote.subtotal,
    totalDiscount: 0,
    totalAmount: quote.totalAmount,
    paidAmount: 0,
    amountDue: quote.totalAmount,
    scopeOfWork: quote.notes || "Official invoice generated from accepted Quotation #" + quote.quotationNumber,
    paymentTermsNote: "Payment Terms: Payment is due as per the agreed quotation/payment schedule.",
  };

  const invoice = await prisma.invoiceRequest.create({
    data: {
      customerId: quote.customerId,
      subtotal: quote.subtotal,
      gstPercentage: 0,
      amountRequested: quote.totalAmount,
      notes: quote.notes,
      status: "INVOICE_GENERATED",
      aroniumInvoiceNo: invNumber,
      structuredData: structuredPayload,
      requestedById: session.userId as string,
      assignedAdminId: session.userId as string,
    }
  });

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "CONVERTED" }
  });

  revalidatePath("/billing");
  revalidatePath("/quotations");
  redirect(`/billing/doc/invoice/${invoice.id}`);
}
