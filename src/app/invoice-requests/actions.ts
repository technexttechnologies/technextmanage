"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadPublicFile } from "@/lib/cloudinaryStorage";
import { sendAdminNotification, sendCustomerStatusUpdate } from "@/lib/mailer";
import { parseQuotationPdf } from "@/lib/aiQuotationParser";

export async function createInvoiceRequest(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const customerId = formData.get("customerId") as string;
  const projectId = formData.get("projectId") as string;
  const subtotalStr = formData.get("subtotal") as string;
  const subtotal = parseFloat(subtotalStr || "0");
  const notes = formData.get("notes") as string;

  const gstPercentage = 0;
  const amountRequested = parseFloat(subtotal.toFixed(2));

  if (!customerId || isNaN(amountRequested)) {
    throw new Error("Missing required fields");
  }

  const request = await prisma.invoiceRequest.create({
    data: {
      customerId,
      projectId: projectId || null,
      subtotal,
      gstPercentage,
      amountRequested,
      notes: notes || null,
      requestedById: session.userId as string,
      status: "SUBMITTED"
    },
    include: { customer: true, requestedBy: true }
  });

  await prisma.activityLog.create({
    data: {
      action: "CREATED",
      entityType: "INVOICE_REQUEST",
      entityId: request.id,
      userId: session.userId as string,
      details: "Employee submitted a new invoice request."
    }
  });

  const adminHtml = `
    <h2>New Invoice Request</h2>
    <p><strong>Employee:</strong> ${request.requestedBy.name}</p>
    <p><strong>Customer:</strong> ${request.customer.name}</p>
    <p><strong>Amount:</strong> ₹${amountRequested.toFixed(2)}</p>
    <a href="https://technextmanage.vercel.app/invoice-requests/${request.id}">View Request</a>
  `;
  await sendAdminNotification("New Invoice Request Submitted", adminHtml);

  // Notify Customer with Tracking Link
  await sendCustomerStatusUpdate(request.customer.email, "Invoice Request", "SUBMITTED", "We are preparing your invoice.", null, request.id);

  revalidatePath("/invoice-requests");
  redirect("/invoice-requests");
}

export async function updateInvoiceStatus(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only admins can update status");
  }

  const id = formData.get("requestId") as string;
  const status = formData.get("status") as string;
  const adminNotes = formData.get("adminNotes") as string;
  const aroniumInvoiceNo = formData.get("aroniumInvoiceNo") as string;

  const request = await prisma.invoiceRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      aroniumInvoiceNo: aroniumInvoiceNo || null,
      assignedAdminId: session.userId as string
    },
    include: { customer: true }
  });

  await prisma.activityLog.create({
    data: {
      action: "STATUS_UPDATED",
      entityType: "INVOICE_REQUEST",
      entityId: request.id,
      userId: session.userId as string,
      details: `Admin changed status to ${status}.`
    }
  });

  // Send payment confirmation if PAID
  if (status === "PAID" && request.customer.email) {
    const { templates } = await import("@/lib/email-templates");
    const { generateTechnextEmailHtml, sendEmail } = await import("@/lib/mailer");
    const emailHtml = generateTechnextEmailHtml(
      "Payment Received",
      templates.paymentConfirmation({
        receiptNo: `REC-${request.id.substring(0, 8)}`,
        amount: request.amountRequested,
        date: new Date().toLocaleDateString()
      })
    );
    await sendEmail(request.customer.email, "Payment Confirmation - TechNext", emailHtml);
  } else {
    // Always send customer status update when an admin changes the status
    await sendCustomerStatusUpdate(
      request.customer.email, 
      "Invoice", 
      status, 
      adminNotes, 
      request.pdfUrl,
      request.id
    );
  }

  revalidatePath(`/invoice-requests/${id}`);
  revalidatePath("/invoice-requests");
}

export async function uploadInvoicePdf(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only admins can upload PDFs");
  }

  const id = formData.get("requestId") as string;
  const file = formData.get("pdf") as File;

  if (!id || !file || typeof (file as any).arrayBuffer !== 'function') {
    throw new Error("Missing file or request ID");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Upload PDF to Cloudinary as a PUBLIC file so it can be shared in emails
  const { secureUrl } = await uploadPublicFile(
    `invoice-${id}-${file.name}`,
    file.type || 'application/pdf',
    fileBuffer
  );

  // Extract structured data using AI or use provided data
  let structuredData = null;
  const providedStructuredData = formData.get("structuredData") as string;
  
  if (providedStructuredData) {
    try {
      structuredData = JSON.parse(providedStructuredData);
    } catch (e) {
      console.error("Invalid structuredData JSON provided from frontend");
    }
  }

  if (!structuredData) {
    try {
      const base64Data = fileBuffer.toString("base64");
      // Invoices share the same layout structure, so we reuse parseQuotationPdf
      structuredData = await parseQuotationPdf(base64Data, file.type || "application/pdf");
    } catch (err) {
      console.error("AI Parsing failed during upload:", err);
    }
  }

  const request = await prisma.invoiceRequest.update({
    where: { id },
    data: { 
      pdfUrl: secureUrl,
      structuredData: structuredData as any,
      status: "PDF_UPLOADED"
    },
    include: { customer: true }
  });

  await prisma.activityLog.create({
    data: {
      action: "PDF_UPLOADED",
      entityType: "INVOICE_REQUEST",
      entityId: request.id,
      userId: session.userId as string,
      details: "Admin uploaded the official invoice PDF."
    }
  });

  // Notify customer with PDF link using premium template
  const { templates } = await import("@/lib/email-templates");
  const { generateTechnextEmailHtml, sendEmail } = await import("@/lib/mailer");
  
  if (request.customer.email) {
    const emailHtml = generateTechnextEmailHtml(
      "Your Invoice is Ready",
      templates.invoiceEmail({
        customerName: request.customer.name,
        invoiceNumber: request.aroniumInvoiceNo || `INV-${request.id.substring(0, 8)}`,
        amount: request.amountRequested,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // Example: 7 days due
      }),
      { text: "View Dynamic Invoice", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/request/invoice/${request.id}` }
    );
    await sendEmail(request.customer.email, `Invoice #${request.aroniumInvoiceNo || request.id.substring(0, 8)} from TechNext`, emailHtml);
  }

  revalidatePath(`/invoice-requests/${id}`);
  revalidatePath("/invoice-requests");
}

export async function deleteInvoiceRequest(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only admins can delete requests");
  }

  const requestId = formData.get("requestId") as string;
  
  await prisma.invoiceRequest.delete({
    where: { id: requestId }
  });

  revalidatePath("/invoice-requests");
  redirect("/invoice-requests");
}

export async function sendInvoiceReminder(id: string) {
  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!invoice || !invoice.customer.email) return;

  const emailSubject = `Payment Reminder: Invoice #${invoice.aroniumInvoiceNo || invoice.id.substring(0, 8)}`;
  const { templates } = await import("@/lib/email-templates");
  const { generateTechnextEmailHtml, sendEmail } = await import("@/lib/mailer");
  
  let emailBody = `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Payment Reminder</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello ${invoice.customer.name},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.6;">This is a friendly reminder that we are still awaiting payment for your recent invoice.</p>
    
    <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">Invoice Number</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${invoice.aroniumInvoiceNo || `INV-${invoice.id.substring(0, 8)}`}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">Amount Due</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">₹${invoice.amountRequested.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.6;">You can view your invoice and arrange for payment using the link below.</p>
  `;

  const emailHtml = generateTechnextEmailHtml(
    emailSubject, 
    emailBody,
    { text: "View and Pay Invoice", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/track/${invoice.id}` }
  );

  await sendEmail(invoice.customer.email, emailSubject, emailHtml);

  await prisma.invoiceRequest.update({
    where: { id },
    data: { lastReminderSentAt: new Date() }
  });

  revalidatePath(`/invoice-requests/${id}`);
  revalidatePath("/payments");
}
