"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  sendWhatsAppNotification, 
  buildInvoiceNotificationMessage, 
  buildQuotationNotificationMessage,
  getAppUrl 
} from "@/lib/whatsapp";

async function triggerLocalAroniumSync() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    await fetch("http://127.0.0.1:4040/sync", { signal: controller.signal }).catch(() => {});
    clearTimeout(timeout);
  } catch (e) {
    // Ignore ping failure if cloud-hosted or agent not local
  }
}

export async function quickCreateBillingCustomer(data: {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!data.name?.trim()) throw new Error("Customer name is required");

  // Check phone deduplication
  if (data.phone) {
    const clean = data.phone.replace(/\D/g, "");
    if (clean.length >= 10) {
      const existing = await prisma.customer.findFirst({
        where: {
          phone: { contains: clean.slice(-10) }
        }
      });
      if (existing) {
        // Update customer details with the newly provided name/company/details
        const updated = await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: data.name.trim(),
            company: data.company?.trim() || existing.company,
            email: data.email?.trim() || existing.email,
            address: data.address?.trim() || existing.address,
            gstNumber: data.gstNumber?.trim() || existing.gstNumber,
            syncStatus: "PENDING",
          }
        });
        await triggerLocalAroniumSync();
        return {
          success: true,
          customer: updated,
          isExisting: true
        };
      }
    }
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name.trim(),
      company: data.company?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      gstNumber: data.gstNumber?.trim() || null,
      assignedToId: session.userId as string,
      status: "ACTIVE",
    }
  });

  await triggerLocalAroniumSync();

  return {
    success: true,
    customer,
    isExisting: false
  };
}

export async function createBillingDocument(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const documentType = (formData.get("documentType") as string) || "INVOICE";
  const customerId = formData.get("customerId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const documentNumber = formData.get("documentNumber") as string;
  const dateStr = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const dueDateStr = (formData.get("dueDate") as string) || dateStr;
  
  // Payment Mode: SINGLE, MULTI_DATE, or CREDIT
  const paymentType = (formData.get("paymentType") as string) || "SINGLE";
  let paymentMethod = (formData.get("paymentMethod") as string) || "UPI PAYMENT";
  let paymentStatus = (formData.get("paymentStatus") as string) || "Paid";
  const bankDetails = (formData.get("bankDetails") as string) || "SOUTH INDIAN BANK\nPULPALLY";
  
  const subtotal = parseFloat((formData.get("subtotal") as string) || "0");
  const totalDiscount = parseFloat((formData.get("totalDiscount") as string) || "0");
  const totalAmount = parseFloat((formData.get("totalAmount") as string) || "0");
  let paidAmount = parseFloat((formData.get("paidAmount") as string) || "0");
  let amountDue = parseFloat((formData.get("amountDue") as string) || "0");

  // Multi-date payment schedule / installments
  const paymentScheduleJson = formData.get("paymentScheduleJson") as string;
  let paymentSchedule: any[] = [];
  if (paymentScheduleJson) {
    try {
      paymentSchedule = JSON.parse(paymentScheduleJson);
    } catch {
      paymentSchedule = [];
    }
  }

  const creditDueDate = (formData.get("creditDueDate") as string) || null;
  const creditTerms = (formData.get("creditTerms") as string) || null;

  if (paymentType === "CREDIT") {
    paymentMethod = creditTerms ? `CREDIT SALE (${creditTerms})` : "CREDIT SALE";
    paymentStatus = "Credit / Due";
    paidAmount = 0;
    amountDue = totalAmount;
  } else if ((paymentType === "MULTI_DATE" || paymentType === "SPLIT") && paymentSchedule.length > 0) {
    const totalPaidFromSchedule = paymentSchedule
      .filter((p: any) => p.status === "PAID")
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    paidAmount = totalPaidFromSchedule;
    amountDue = Math.max(0, totalAmount - paidAmount);
    paymentStatus = paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partially Paid" : "Pending";
    paymentMethod = "SPLIT / MULTI-DATE";
  }

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

  const customerName = (formData.get("customerName") as string) || "";
  const customerCompany = (formData.get("customerCompany") as string) || "";
  const customerPhone = (formData.get("customerPhone") as string) || "";
  const customerEmail = (formData.get("customerEmail") as string) || "";
  const customerAddress = (formData.get("customerAddress") as string) || "";
  const customerGst = (formData.get("customerGst") as string) || "";

  if (customerId && customerName.trim()) {
    const cleanPhone = customerPhone ? customerPhone.replace(/\s+/g, "") : null;
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: customerName.trim(),
        company: customerCompany.trim() || null,
        phone: cleanPhone || undefined,
        email: customerEmail.trim() || undefined,
        address: customerAddress.trim() || undefined,
        gstNumber: customerGst.trim() || undefined,
        syncStatus: "PENDING"
      }
    });
  }

  let createdId = "";

  if (documentType === "QUOTATION") {
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
        companyName: customerCompany.trim() || customerName.trim() || customer.company || customer.name,
        companyAddress: customerAddress.trim() || customer.address,
        companyGst: customerGst.trim() || customer.gstNumber,
        meta: {
          isEditedByUser: true,
          lastEditedAt: new Date().toISOString()
        },
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

    // Send WhatsApp notification for quotation
    if (customer.phone) {
      try {
        const trackingUrl = customer.portalToken
          ? `${getAppUrl()}/portal/${customer.portalToken}/quotations/${quotation.id}`
          : `${getAppUrl()}/quotation/${quotation.id}`;
        const waMsg = buildQuotationNotificationMessage({
          customerName: customer.name,
          quoteNo: documentNumber,
          amount: totalAmount,
          trackingUrl,
        });
        await sendWhatsAppNotification({
          phone: customer.phone,
          recipientName: customer.name,
          message: waMsg,
          triggerType: "QUOTATION",
          customerId: customer.id,
        });
      } catch (waErr) {
        console.error("[Billing Quotation WhatsApp Error]", waErr);
      }
    }
  } else {
    // INVOICE, ORDER_FORM, or PAYMENT_RECEIPT
    const structuredPayload = {
      documentType,
      documentNumber,
      date: dateStr,
      dueDate: dueDateStr,
      paymentType,
      paymentStatus,
      paymentMethod,
      paymentSchedule,
      creditDueDate,
      creditTerms,
      bankDetails,
      customerName: customerName.trim() || customer.name,
      customerCompany: customerCompany.trim() || customer.company,
      customerPhone: customerPhone.trim() || customer.phone,
      customerEmail: customerEmail.trim() || customer.email,
      customerAddress: customerAddress.trim() || customer.address,
      customerGst: customerGst.trim() || customer.gstNumber,
      items,
      subtotal,
      totalDiscount,
      totalAmount,
      paidAmount,
      amountDue,
      scopeOfWork,
      paymentTermsNote,
      stockDeducted: paymentStatus === "Paid",
      isEditedByUser: true,
      lastEditedAt: new Date().toISOString(),
      needsAroniumSync: true
    };

    const isPartiallyPaid = paymentStatus === "Partially Paid" || (paidAmount > 0 && amountDue > 0);
    const status = paymentStatus === "Paid" 
      ? "PAID" 
      : isPartiallyPaid
      ? "PARTIALLY_PAID"
      : paymentStatus.includes("Credit")
      ? "SENT_TO_CUSTOMER"
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

    // Deduct stock if Paid and not a service
    if (paymentStatus === "Paid" && items.length > 0) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          const product = await prisma.erpProduct.findUnique({
            where: { id: item.productId }
          });
          if (product && !product.isService && product.productType !== "SERVICE") {
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

    // Send WhatsApp notification
    if (customer.phone) {
      try {
        const trackingUrl = customer.portalToken
          ? `${getAppUrl()}/portal/${customer.portalToken}/invoices/${invoice.id}`
          : `${getAppUrl()}/request/invoice/${invoice.id}`;
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

  await triggerLocalAroniumSync();

  redirect(`/billing/doc/${documentType.toLowerCase()}/${createdId}`);
}

export async function updateBillingDocument(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const documentType = (formData.get("documentType") as string) || "INVOICE";
  const customerId = formData.get("customerId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const documentNumber = formData.get("documentNumber") as string;
  const dateStr = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const dueDateStr = (formData.get("dueDate") as string) || dateStr;
  
  const paymentType = (formData.get("paymentType") as string) || "SINGLE";
  let paymentMethod = (formData.get("paymentMethod") as string) || "UPI PAYMENT";
  let paymentStatus = (formData.get("paymentStatus") as string) || "Paid";
  const bankDetails = (formData.get("bankDetails") as string) || "SOUTH INDIAN BANK\nPULPALLY";
  
  const subtotal = parseFloat((formData.get("subtotal") as string) || "0");
  const totalDiscount = parseFloat((formData.get("totalDiscount") as string) || "0");
  const totalAmount = parseFloat((formData.get("totalAmount") as string) || "0");
  let paidAmount = parseFloat((formData.get("paidAmount") as string) || "0");
  let amountDue = parseFloat((formData.get("amountDue") as string) || "0");

  const paymentScheduleJson = formData.get("paymentScheduleJson") as string;
  let paymentSchedule: any[] = [];
  if (paymentScheduleJson) {
    try {
      paymentSchedule = JSON.parse(paymentScheduleJson);
    } catch {
      paymentSchedule = [];
    }
  }

  const creditDueDate = (formData.get("creditDueDate") as string) || null;
  const creditTerms = (formData.get("creditTerms") as string) || null;

  if (paymentType === "CREDIT") {
    paymentMethod = creditTerms ? `CREDIT SALE (${creditTerms})` : "CREDIT SALE";
    paymentStatus = "Credit / Due";
    paidAmount = 0;
    amountDue = totalAmount;
  } else if ((paymentType === "MULTI_DATE" || paymentType === "SPLIT") && paymentSchedule.length > 0) {
    const totalPaidFromSchedule = paymentSchedule
      .filter((p: any) => p.status === "PAID")
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    paidAmount = totalPaidFromSchedule;
    amountDue = Math.max(0, totalAmount - paidAmount);
    paymentStatus = paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partially Paid" : "Pending";
    paymentMethod = "SPLIT / MULTI-DATE";
  }

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

  const customerName = (formData.get("customerName") as string) || "";
  const customerCompany = (formData.get("customerCompany") as string) || "";
  const customerPhone = (formData.get("customerPhone") as string) || "";
  const customerEmail = (formData.get("customerEmail") as string) || "";
  const customerAddress = (formData.get("customerAddress") as string) || "";
  const customerGst = (formData.get("customerGst") as string) || "";

  if (customerId && customerName.trim()) {
    const cleanPhone = customerPhone ? customerPhone.replace(/\s+/g, "") : null;
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: customerName.trim(),
        company: customerCompany.trim() || null,
        phone: cleanPhone || undefined,
        email: customerEmail.trim() || undefined,
        address: customerAddress.trim() || undefined,
        gstNumber: customerGst.trim() || undefined,
        syncStatus: "PENDING"
      }
    });
  }

  let targetQuoteId = id;
  let targetId = id;

  if (documentType === "QUOTATION") {
    let quote = await prisma.quotation.findUnique({ where: { id } });
    if (!quote && documentNumber) {
      quote = await prisma.quotation.findFirst({ where: { quotationNumber: documentNumber } });
    }
    targetQuoteId = quote?.id || id;

    await prisma.quotationItem.deleteMany({
      where: { quotationId: targetQuoteId }
    });

    await prisma.quotation.update({
      where: { id: targetQuoteId },
      data: {
        quotationNumber: documentNumber,
        customerId,
        companyName: customerCompany.trim() || customerName.trim() || quote?.companyName || null,
        companyAddress: customerAddress.trim() || quote?.companyAddress || null,
        companyGst: customerGst.trim() || quote?.companyGst || null,
        date: new Date(dateStr),
        expiryDate: new Date(dueDateStr),
        totalAmount,
        subtotal,
        notes: scopeOfWork || notes,
        meta: {
          isEditedByUser: true,
          lastEditedAt: new Date().toISOString()
        },
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
  } else {
    let existing = await prisma.invoiceRequest.findUnique({ where: { id } });
    if (!existing && documentNumber) {
      existing = await prisma.invoiceRequest.findFirst({ where: { aroniumInvoiceNo: documentNumber } });
    }
    targetId = existing?.id || id;
    const prevStructured = (existing?.structuredData as any) || {};

    const isPartiallyPaid = paymentStatus === "Partially Paid" || (paidAmount > 0 && amountDue > 0);

    const structuredPayload = {
      ...prevStructured,
      documentType,
      documentNumber,
      date: dateStr,
      dueDate: dueDateStr,
      paymentType,
      paymentStatus: isPartiallyPaid ? "Partially Paid" : paymentStatus,
      paymentMethod,
      paymentSchedule,
      creditDueDate,
      creditTerms,
      bankDetails,
      customerName: customerName.trim() || prevStructured.customerName,
      customerCompany: customerCompany.trim() || prevStructured.customerCompany,
      customerPhone: customerPhone.trim() || prevStructured.customerPhone,
      customerEmail: customerEmail.trim() || prevStructured.customerEmail,
      customerAddress: customerAddress.trim() || prevStructured.customerAddress,
      customerGst: customerGst.trim() || prevStructured.customerGst,
      items,
      subtotal,
      totalDiscount,
      totalAmount,
      paidAmount,
      amountDue,
      scopeOfWork,
      paymentTermsNote,
      isEditedByUser: true,
      lastEditedAt: new Date().toISOString(),
      needsAroniumSync: true,
      isEdited: true
    };

    const status = paymentStatus === "Paid" 
      ? "PAID" 
      : isPartiallyPaid
      ? "PARTIALLY_PAID"
      : paymentStatus.includes("Credit")
      ? "SENT_TO_CUSTOMER"
      : documentType === "ORDER_FORM" 
      ? "APPROVED" 
      : "INVOICE_GENERATED";

    await prisma.invoiceRequest.update({
      where: { id: targetId },
      data: {
        customerId,
        projectId,
        subtotal,
        amountRequested: totalAmount,
        notes: scopeOfWork || notes,
        status,
        aroniumInvoiceNo: documentNumber,
        structuredData: structuredPayload,
      }
    });

    // Update ErpSale if linked so ERP dashboard stays synced
    if (documentNumber) {
      const existingSale = await prisma.erpSale.findFirst({
        where: { invoiceNumber: documentNumber }
      });
      if (existingSale) {
        await prisma.erpSale.update({
          where: { id: existingSale.id },
          data: {
            totalAmount,
            discount: totalDiscount,
            paymentMethod,
            paymentStatus: paymentStatus === "Paid" ? "PAID" : isPartiallyPaid ? "PARTIAL" : "PENDING",
            date: new Date(dateStr)
          }
        });
      }
    }

    // Deduct stock if transitioned to Paid and not previously deducted
    if (paymentStatus === "Paid" && !prevStructured.stockDeducted && items.length > 0) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          const product = await prisma.erpProduct.findUnique({
            where: { id: item.productId }
          });
          if (product && !product.isService && product.productType !== "SERVICE") {
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
      await prisma.invoiceRequest.update({
        where: { id: targetId },
        data: {
          structuredData: {
            ...structuredPayload,
            stockDeducted: true,
            stockDeductedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  const finalDocId = documentType === "QUOTATION" ? (targetQuoteId || id) : (targetId || id);
  revalidatePath("/billing");
  revalidatePath(`/billing/doc/${documentType.toLowerCase()}/${finalDocId}`);
  revalidatePath(`/billing/doc/${documentType.toLowerCase()}/${id}`);
  revalidatePath("/invoice-requests");
  revalidatePath("/quotations");
  revalidatePath("/inventory");

  await triggerLocalAroniumSync();

  redirect(`/billing/doc/${documentType.toLowerCase()}/${finalDocId}`);
}

export async function recordDocumentPayment(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const documentId = formData.get("documentId") as string;
  const dateStr = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const amount = parseFloat((formData.get("amount") as string) || "0");
  const method = (formData.get("method") as string) || "UPI PAYMENT";
  const reference = (formData.get("reference") as string) || "";
  const paymentStatusOption = (formData.get("status") as string) || "PAID";

  if (!documentId || isNaN(amount) || amount <= 0) {
    throw new Error("Invalid payment amount or document ID");
  }

  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id: documentId },
    include: { customer: true }
  });

  if (!invoice) throw new Error("Document not found");

  const structured = (invoice.structuredData as any) || {};
  let schedule = Array.isArray(structured.paymentSchedule) ? [...structured.paymentSchedule] : [];

  const newEntry = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: dateStr,
    amount,
    method,
    reference,
    status: paymentStatusOption,
    recordedBy: session.name || "Accounts Staff",
    recordedAt: new Date().toISOString()
  };

  schedule.push(newEntry);

  const totalAmount = structured.totalAmount || invoice.amountRequested;
  const totalPaid = schedule
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const amountDue = Math.max(0, totalAmount - totalPaid);
  const paymentStatus = totalPaid >= totalAmount ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Pending";
  const invStatus = totalPaid >= totalAmount ? "PAID" : "UNDER_REVIEW";

  await prisma.invoiceRequest.update({
    where: { id: documentId },
    data: {
      status: invStatus,
      structuredData: {
        ...structured,
        paymentSchedule: schedule,
        paidAmount: totalPaid,
        amountDue,
        paymentStatus,
        paymentMethod: schedule.length > 1 ? "SPLIT / MULTI-DATE" : method
      }
    }
  });

  await prisma.activityLog.create({
    data: {
      action: "PAYMENT_RECORDED",
      entityType: "INVOICE_REQUEST",
      entityId: documentId,
      userId: session.userId as string,
      details: `Recorded payment installment of ₹${amount.toFixed(2)} on ${dateStr} via ${method}`
    }
  });

  revalidatePath("/billing");
  revalidatePath(`/billing/doc/invoice/${documentId}`);
  revalidatePath(`/billing/doc/order_form/${documentId}`);
  revalidatePath(`/billing/doc/payment_receipt/${documentId}`);
  revalidatePath("/payments");

  await triggerLocalAroniumSync();
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

  await triggerLocalAroniumSync();

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
    paymentSchedule: [],
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

  await triggerLocalAroniumSync();

  redirect(`/billing/doc/invoice/${invoice.id}`);
}

export async function processReturnAndRefund(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const originalDocId = formData.get("originalDocId") as string;
  const refundAmount = parseFloat((formData.get("refundAmount") as string) || "0");
  const refundMethod = (formData.get("refundMethod") as string) || "UPI REVERSAL";
  const reason = (formData.get("reason") as string) || "Customer return / cancellation";
  const returnItemsJson = (formData.get("returnItemsJson") as string) || "[]";

  if (!originalDocId || isNaN(refundAmount) || refundAmount <= 0) {
    throw new Error("Invalid document ID or refund amount");
  }

  const parentDoc = await prisma.invoiceRequest.findUnique({
    where: { id: originalDocId },
    include: { customer: true, project: true }
  });

  if (!parentDoc) throw new Error("Original invoice not found");

  let parsedItems: any[] = [];
  try {
    parsedItems = JSON.parse(returnItemsJson);
  } catch {
    parsedItems = [];
  }

  // Find next refund number sequence (e.g. 26-220-000003)
  const existingRefunds = await prisma.invoiceRequest.findMany({
    where: {
      aroniumInvoiceNo: {
        contains: "220-"
      }
    },
    select: { aroniumInvoiceNo: true }
  });

  let maxSeq = 2;
  existingRefunds.forEach(r => {
    if (r.aroniumInvoiceNo) {
      const match = r.aroniumInvoiceNo.match(/220-(\d+)/);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > maxSeq) maxSeq = val;
      }
    }
  });

  const nextSeqStr = String(maxSeq + 1).padStart(6, "0");
  const refundNumber = `26-220-${nextSeqStr}`;
  const negativeAmount = -Math.abs(refundAmount);

  const refundItems = parsedItems.length > 0 
    ? parsedItems.map((it: any) => ({
        name: `[RETURN] ${it.name}`,
        description: `Returned item from #${parentDoc.aroniumInvoiceNo || parentDoc.id}. Reason: ${reason}`,
        quantity: Math.abs(Number(it.quantity) || 1),
        unitPrice: Math.abs(Number(it.unitPrice) || 0),
        tax: it.tax || "18%",
        discount: "0.00",
        total: -Math.abs(Number(it.total) || (Number(it.quantity) * Number(it.unitPrice)))
      }))
    : [{
        name: `Return / Refund: ${parentDoc.notes || "Professional Tech Services"}`,
        description: `Credit note issued against #${parentDoc.aroniumInvoiceNo || parentDoc.id}. Reason: ${reason}`,
        quantity: 1,
        unitPrice: Math.abs(refundAmount),
        tax: "18%",
        discount: "0.00",
        total: negativeAmount
      }];

  const parentStruct = (parentDoc.structuredData as any) || {};

  const structuredPayload = {
    documentType: "REFUND",
    documentNumber: refundNumber,
    referenceDocument: parentDoc.aroniumInvoiceNo || parentDoc.id,
    originalInvoiceId: parentDoc.id,
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    paymentStatus: "Refunded",
    paymentMethod: refundMethod,
    bankDetails: parentStruct.bankDetails || "SOUTH INDIAN BANK\nPULPALLY",
    items: refundItems,
    subtotal: negativeAmount,
    totalDiscount: 0,
    totalAmount: negativeAmount,
    paidAmount: negativeAmount,
    amountDue: 0,
    reason,
    scopeOfWork: `Official Credit Note / Return Document issued against Invoice #${parentDoc.aroniumInvoiceNo || parentDoc.id}. Amount of ₹${refundAmount.toLocaleString("en-IN")} refunded via ${refundMethod}. Reason: ${reason}`,
    paymentTermsNote: "Official Return & Credit Note. Processed and reconciled with enterprise accounts.",
  };

  const refundDoc = await prisma.invoiceRequest.create({
    data: {
      customerId: parentDoc.customerId,
      projectId: parentDoc.projectId,
      subtotal: negativeAmount,
      gstPercentage: 0,
      amountRequested: negativeAmount,
      notes: `Official Refund #${refundNumber} against #${parentDoc.aroniumInvoiceNo || parentDoc.id}. Reason: ${reason}`,
      status: "PAID",
      aroniumInvoiceNo: refundNumber,
      structuredData: structuredPayload,
      requestedById: session.userId as string,
      assignedAdminId: session.userId as string,
    }
  });

  await prisma.activityLog.create({
    data: {
      action: "REFUND_ISSUED",
      entityType: "INVOICE",
      entityId: refundDoc.id,
      userId: session.userId as string,
      details: `Issued Refund #${refundNumber} for ₹${refundAmount.toLocaleString("en-IN")} against #${parentDoc.aroniumInvoiceNo || parentDoc.id} (${reason})`
    }
  });

  revalidatePath("/billing");
  revalidatePath("/erp/reports");
  revalidatePath("/dashboard");

  await triggerLocalAroniumSync();

  return {
    success: true,
    refundDocId: refundDoc.id,
    refundNumber
  };
}
