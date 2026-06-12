"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinaryStorage";
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

  // Always send customer status update when an admin changes the status
  await sendCustomerStatusUpdate(
    request.customer.email, 
    "Invoice", 
    status, 
    adminNotes, 
    request.pdfUrl,
    request.id
  );

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

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Upload to Cloudinary
  const { secureUrl } = await uploadToCloudinary(
    `invoice-${id}-${file.name}`,
    file.type || 'application/pdf',
    fileBuffer
  );

  const request = await prisma.invoiceRequest.update({
    where: { id },
    data: { 
      pdfUrl: secureUrl,
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

  revalidatePath(`/invoice-requests/${id}`);
  revalidatePath("/invoice-requests");
}
