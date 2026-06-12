"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from '@vercel/blob';
import { sendAdminNotification, sendCustomerStatusUpdate } from "@/lib/mailer";

export async function createInvoiceRequest(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const customerId = formData.get("customerId") as string;
  const projectId = formData.get("projectId") as string;
  const amountRequested = parseFloat(formData.get("amountRequested") as string);
  const notes = formData.get("notes") as string;

  if (!customerId || isNaN(amountRequested)) {
    throw new Error("Missing required fields");
  }

  const request = await prisma.invoiceRequest.create({
    data: {
      customerId,
      projectId: projectId || null,
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

  if (status === "SENT_TO_CUSTOMER" || status === "PAID") {
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

  if (!id || !file || !(file instanceof Blob)) throw new Error("Missing file");

  const fileBuffer = await file.arrayBuffer();

  const blob = await put(`invoices/${id}_${file.name}`, fileBuffer, { 
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: file.type || 'application/pdf'
  });

  const request = await prisma.invoiceRequest.update({
    where: { id },
    data: { 
      pdfUrl: blob.url,
      status: "PDF_UPLOADED"
    }
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

  revalidatePath(`/invoice-requests/${id}`);
  revalidatePath("/invoice-requests");
}
