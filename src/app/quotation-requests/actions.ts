"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from '@vercel/blob';
import { sendAdminNotification, sendCustomerStatusUpdate } from "@/lib/mailer";

export async function createQuotationRequest(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const customerId = formData.get("customerId") as string;
  const serviceName = formData.get("serviceName") as string;
  const requirementDetails = formData.get("requirementDetails") as string;
  const budget = formData.get("budget") as string;
  const priority = formData.get("priority") as string;

  if (!customerId || !serviceName || !requirementDetails) {
    throw new Error("Missing required fields");
  }

  const request = await prisma.quotationRequest.create({
    data: {
      customerId,
      serviceName,
      requirementDetails,
      budget: budget || null,
      priority,
      requestedById: session.userId as string,
      status: "SUBMITTED"
    },
    include: {
      customer: true,
      requestedBy: true
    }
  });

  await prisma.activityLog.create({
    data: {
      action: "CREATED",
      entityType: "QUOTATION_REQUEST",
      entityId: request.id,
      userId: session.userId as string,
      details: "Employee submitted a new quotation request."
    }
  });

  // Notify Admins
  const adminHtml = `
    <h2>New Quotation Request</h2>
    <p><strong>Employee:</strong> ${request.requestedBy.name}</p>
    <p><strong>Customer:</strong> ${request.customer.name}</p>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Priority:</strong> ${priority}</p>
    <a href="https://technextmanage.vercel.app/quotation-requests/${request.id}">View Request</a>
  `;
  await sendAdminNotification("New Quotation Request Submitted", adminHtml);

  revalidatePath("/quotation-requests");
  redirect("/quotation-requests");
}

export async function updateQuotationStatus(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only admins can update status");
  }

  const id = formData.get("requestId") as string;
  const status = formData.get("status") as string;
  const adminNotes = formData.get("adminNotes") as string;
  const aroniumQuotationNo = formData.get("aroniumQuotationNo") as string;

  const request = await prisma.quotationRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      aroniumQuotationNo: aroniumQuotationNo || null,
      assignedAdminId: session.userId as string
    },
    include: { customer: true }
  });

  await prisma.activityLog.create({
    data: {
      action: "STATUS_UPDATED",
      entityType: "QUOTATION_REQUEST",
      entityId: request.id,
      userId: session.userId as string,
      details: `Admin changed status to ${status}.`
    }
  });

  // If status implies sending to customer, send email
  if (status === "SENT_TO_CUSTOMER") {
    await sendCustomerStatusUpdate(
      request.customer.email, 
      "Quotation Request", 
      status, 
      adminNotes, 
      request.pdfUrl,
      request.id
    );
  }

  revalidatePath(`/quotation-requests/${id}`);
  revalidatePath("/quotation-requests");
}

export async function uploadQuotationPdf(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Only admins can upload PDFs");
  }

  const id = formData.get("requestId") as string;
  const file = formData.get("pdf") as File;

  if (!id || !file || !(file instanceof Blob)) {
    throw new Error("Missing file or request ID");
  }

  const blob = await put(`quotations/${id}_${file.name}`, file, { access: 'public' });

  const request = await prisma.quotationRequest.update({
    where: { id },
    data: { 
      pdfUrl: blob.url,
      status: "PDF_UPLOADED"
    },
    include: { customer: true }
  });

  await prisma.activityLog.create({
    data: {
      action: "PDF_UPLOADED",
      entityType: "QUOTATION_REQUEST",
      entityId: request.id,
      userId: session.userId as string,
      details: "Admin uploaded the official quotation PDF."
    }
  });

  revalidatePath(`/quotation-requests/${id}`);
  revalidatePath("/quotation-requests");
}
