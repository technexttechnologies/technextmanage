"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendAdminNotification, sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { findExistingCustomer } from "@/lib/customerDedup";
import crypto from "crypto";
import { 
  sendWhatsAppNotification, 
  buildProjectUpdateMessage, 
  buildServiceRequestMessage,
  buildCustomerPortalMessage,
  buildCustomerReviewMessage,
  getWhatsAppLink,
  getAppUrl 
} from "@/lib/whatsapp";

// 1. Submit Quotation Request
export async function requestQuotation(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized: Please log in to request quotations.");
  }

  const customerId = formData.get("customerId") as string;
  const serviceName = formData.get("serviceName") as string;
  const requirementDetails = formData.get("requirementDetails") as string;
  const budget = formData.get("budget") as string;
  const priority = (formData.get("priority") as string) || "MEDIUM";

  if (!customerId || !serviceName || !requirementDetails) {
    throw new Error("Please fill in Customer, Service Name, and Requirement Details.");
  }

  const request = await prisma.quotationRequest.create({
    data: {
      customerId,
      serviceName,
      requirementDetails,
      budget: budget || null,
      priority,
      status: "SUBMITTED",
      requestedById: session.userId,
    },
    include: {
      customer: true,
      requestedBy: true,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        action: "QUOTATION_REQUESTED",
        entityType: "QUOTATION_REQUEST",
        entityId: request.id,
        userId: session.userId,
        details: `Sales rep ${request.requestedBy.name} requested quotation for ${request.customer.name} (${serviceName}).`,
      },
    });

    const adminHtml = `
      <h2>New Quotation Request (Sales Portal)</h2>
      <p><strong>Sales Rep:</strong> ${request.requestedBy.name} (${request.requestedBy.email})</p>
      <p><strong>Customer:</strong> ${request.customer.name} ${request.customer.company ? `(${request.customer.company})` : ""}</p>
      <p><strong>Service / Product:</strong> ${serviceName}</p>
      <p><strong>Budget:</strong> ${budget || "Not specified"}</p>
      <p><strong>Priority:</strong> ${priority}</p>
      <p><strong>Requirements:</strong></p>
      <p style="white-space: pre-wrap; background: #f4f4f5; padding: 12px; border-radius: 6px;">${requirementDetails}</p>
      <br/>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/quotation-requests/${request.id}" style="display:inline-block;padding:10px 16px;background:#635bff;color:#fff;text-decoration:none;border-radius:4px;">Review & Generate Quotation</a>
    `;
    await sendAdminNotification(`New Quotation Request: ${serviceName} - ${request.customer.name}`, adminHtml);
  } catch (err) {
    console.error("Non-blocking notification error:", err);
  }

  revalidatePath("/sales");
  revalidatePath("/quotation-requests");
  return { success: true, id: request.id };
}

// 2. Submit Invoice Request
export async function requestInvoice(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized: Please log in to request invoices.");
  }

  const customerId = formData.get("customerId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const subtotalStr = formData.get("subtotal") as string;
  const subtotal = parseFloat(subtotalStr || "0");
  const gstPercentageStr = (formData.get("gstPercentage") as string) || "18";
  const gstPercentage = parseFloat(gstPercentageStr);
  const notes = formData.get("notes") as string;

  if (!customerId || isNaN(subtotal) || subtotal <= 0) {
    throw new Error("Please choose a Customer and enter a valid billing amount.");
  }

  const gstAmount = gstPercentage > 0 ? (subtotal * gstPercentage) / 100 : 0;
  const amountRequested = parseFloat((subtotal + gstAmount).toFixed(2));

  const request = await prisma.invoiceRequest.create({
    data: {
      customerId,
      projectId: projectId || undefined,
      subtotal,
      gstPercentage,
      amountRequested,
      notes: notes || null,
      status: "SUBMITTED",
      requestedById: session.userId,
    },
    include: {
      customer: true,
      project: true,
      requestedBy: true,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        action: "INVOICE_REQUESTED",
        entityType: "INVOICE_REQUEST",
        entityId: request.id,
        userId: session.userId,
        details: `Sales rep ${request.requestedBy.name} requested invoice of ₹${amountRequested} for ${request.customer.name}.`,
      },
    });

    const adminHtml = `
      <h2>New Invoice Request (Sales Portal)</h2>
      <p><strong>Sales Rep:</strong> ${request.requestedBy.name} (${request.requestedBy.email})</p>
      <p><strong>Customer:</strong> ${request.customer.name}</p>
      ${request.project ? `<p><strong>Project:</strong> ${request.project.name}</p>` : ""}
      <p><strong>Subtotal:</strong> ₹${subtotal.toLocaleString("en-IN")}</p>
      <p><strong>GST (${gstPercentage}%):</strong> ₹${gstAmount.toLocaleString("en-IN")}</p>
      <p><strong>Total Amount Requested:</strong> ₹${amountRequested.toLocaleString("en-IN")}</p>
      ${notes ? `<p><strong>Notes/Milestone:</strong> ${notes}</p>` : ""}
      <br/>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/invoice-requests/${request.id}" style="display:inline-block;padding:10px 16px;background:#635bff;color:#fff;text-decoration:none;border-radius:4px;">Review & Issue Invoice</a>
    `;
    await sendAdminNotification(`New Invoice Request: ₹${amountRequested} - ${request.customer.name}`, adminHtml);
  } catch (err) {
    console.error("Non-blocking notification error:", err);
  }

  revalidatePath("/sales");
  revalidatePath("/invoice-requests");
  return { success: true, id: request.id };
}

// 3. Submit Project Request (Deal Handover)
export async function requestProject(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized: Please log in to initiate projects.");
  }

  const name = formData.get("name") as string;
  const customerId = formData.get("customerId") as string;
  const type = formData.get("type") as string;
  const priority = (formData.get("priority") as string) || "MEDIUM";
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const estimatedBudgetStr = formData.get("estimatedBudget") as string;
  const estimatedBudget = estimatedBudgetStr ? parseFloat(estimatedBudgetStr) : null;
  const description = formData.get("description") as string;

  if (!name || !customerId) {
    throw new Error("Project Title and Customer are required.");
  }

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const endDate = endDateStr ? new Date(endDateStr) : null;

  // Find super admin or project manager to assign initial oversight
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "HEAD"] } },
  });

  const project = await prisma.project.create({
    data: {
      name,
      customerId,
      type: type || "Website & Software",
      status: "PROJECT_RECEIVED",
      priority,
      progress: 5,
      startDate,
      endDate,
      estimatedBudget,
      description: description || null,
      salesRepId: session.userId,
      assignedToId: adminUser?.id || session.userId,
    },
    include: {
      customer: true,
      salesRep: true,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        action: "PROJECT_INITIATED",
        entityType: "PROJECT",
        entityId: project.id,
        userId: session.userId,
        details: `Sales rep ${project.salesRep?.name} initiated project "${project.name}" for ${project.customer?.name}.`,
      },
    });

    if (project.customer?.email) {
      const trackingLink = `${getAppUrl()}/track/${project.id}`;
      const emailContent = `
        <p>Dear ${project.customer.name},</p>
        <p>We are delighted to confirm that your project <strong>"${project.name}"</strong> has been officially received and initiated by our sales team.</p>
        <p>Our engineering and technical team is preparing the initial scope analysis and project roadmap.</p>
        <p><strong>Project Type:</strong> ${project.type}</p>
        ${project.endDate ? `<p><strong>Target Delivery:</strong> ${project.endDate.toLocaleDateString()}</p>` : ""}
      `;
      const html = generateTechnextEmailHtml(
        `Project Initiated: ${project.name}`,
        emailContent,
        { text: "Track Project Status", url: trackingLink }
      );
      await sendEmail(project.customer.email, `TechNext: Project Initiated - ${project.name}`, html);
    }

    if (project.customer?.phone) {
      const trackingLink = `${getAppUrl()}/track/${project.id}`;
      const waMsg = buildProjectUpdateMessage({
        customerName: project.customer.name,
        projectName: project.name,
        status: "PROJECT_RECEIVED",
        progress: 5,
        trackingUrl: trackingLink,
        customNote: "Your project has been officially initiated by our sales team and assigned for technical onboarding."
      });
      await sendWhatsAppNotification({
        phone: project.customer.phone,
        recipientName: project.customer.name,
        message: waMsg,
        triggerType: "PROJECT_UPDATE",
        customerId: project.customer.id
      });
    }
  } catch (err) {
    console.error("Non-blocking notification error:", err);
  }

  revalidatePath("/sales");
  revalidatePath("/projects");
  return { success: true, id: project.id };
}

// 4. Submit Service Request / Package Provisioning
export async function requestService(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized: Please log in to request services.");
  }

  const customerId = formData.get("customerId") as string;
  const packageName = formData.get("packageName") as string;
  const packageType = (formData.get("packageType") as string) || "CUSTOM";
  const packagePriceStr = formData.get("packagePrice") as string;
  const packagePrice = parseFloat(packagePriceStr || "0");
  const contractPeriodStr = (formData.get("contractPeriod") as string) || "12";
  const contractPeriod = parseInt(contractPeriodStr, 10);
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const isLifetime = formData.get("isLifetime") === "on";
  const notes = formData.get("notes") as string;

  if (!customerId || !packageName || isNaN(packagePrice)) {
    throw new Error("Customer, Package Name, and Price are required.");
  }

  const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : new Date();
  let renewalDate: Date | null = null;
  if (!isLifetime) {
    renewalDate = new Date(purchaseDate);
    renewalDate.setMonth(renewalDate.getMonth() + contractPeriod);
  }

  const pkg = await prisma.servicePackage.create({
    data: {
      customerId,
      packageName,
      packageType,
      packagePrice,
      purchaseDate,
      renewalDate,
      isLifetime,
      contractPeriod,
      status: "ACTIVE",
      salesRepId: session.userId,
      notes: notes || null,
    },
    include: {
      customer: true,
      salesRep: true,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        action: "SERVICE_PACKAGE_REQUESTED",
        entityType: "SERVICE_PACKAGE",
        entityId: pkg.id,
        userId: session.userId,
        details: `Sales rep ${pkg.salesRep?.name} provisioned service "${pkg.packageName}" (₹${pkg.packagePrice}) for ${pkg.customer.name}.`,
      },
    });

    if (pkg.customer?.email) {
      const emailContent = `
        <p>Dear ${pkg.customer.name},</p>
        <p>Your service subscription for <strong>${pkg.packageName}</strong> has been successfully booked by TechNext Technologies.</p>
        <p><strong>Package Type:</strong> ${pkg.packageType}</p>
        <p><strong>Contract Term:</strong> ${pkg.isLifetime ? "Lifetime Support" : `${pkg.contractPeriod} Months`}</p>
        ${pkg.renewalDate ? `<p><strong>Renewal Date:</strong> ${pkg.renewalDate.toLocaleDateString()}</p>` : ""}
      `;
      const html = generateTechnextEmailHtml(
        `Service Package Activated: ${pkg.packageName}`,
        emailContent,
        { text: "View Customer Portal", url: `${getAppUrl()}/portal/${pkg.customer.portalToken}` }
      );
      await sendEmail(pkg.customer.email, `TechNext: Service Activated - ${pkg.packageName}`, html);
    }

    if (pkg.customer?.phone) {
      const portalUrl = pkg.customer.portalToken ? `${getAppUrl()}/portal/${pkg.customer.portalToken}` : undefined;
      const waMsg = buildServiceRequestMessage({
        customerName: pkg.customer.name,
        serviceName: pkg.packageName,
        packageType: pkg.packageType,
        price: pkg.packagePrice,
        contractPeriod: pkg.contractPeriod,
        isLifetime: pkg.isLifetime,
        portalUrl
      });
      await sendWhatsAppNotification({
        phone: pkg.customer.phone,
        recipientName: pkg.customer.name,
        message: waMsg,
        triggerType: "SERVICE_REQUEST",
        customerId: pkg.customer.id
      });
    }
  } catch (err) {
    console.error("Non-blocking notification error:", err);
  }

  revalidatePath("/sales");
  revalidatePath("/packages");
  return { success: true, id: pkg.id };
}

// 5. Quick Create Customer
export async function quickCreateCustomer(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const gstNumber = formData.get("gstNumber") as string;
  const address = formData.get("address") as string;

  if (!name || !phone) {
    throw new Error("Customer Name and Phone Number are required.");
  }

  const cleanPhone = phone.replace(/\s+/g, "");

  // Prevent duplicates
  const existing = await findExistingCustomer({
    phone: cleanPhone,
    email: email || undefined,
    name: name || undefined,
  });

  if (existing) {
    // Update missing info
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        company: existing.company || company || undefined,
        email: existing.email || email || undefined,
        gstNumber: existing.gstNumber || gstNumber || undefined,
        address: existing.address || address || undefined,
      },
    });
    revalidatePath("/sales");
    return { success: true, customer: updated, existing: true };
  }

  const portalToken = crypto.randomBytes(16).toString("hex");
  const newCustomer = await prisma.customer.create({
    data: {
      name,
      phone: cleanPhone,
      email: email || null,
      company: company || null,
      gstNumber: gstNumber || null,
      address: address || null,
      status: "LEAD",
      portalToken,
      assignedToId: session.userId,
    },
  });

  if (newCustomer.phone) {
    try {
      const portalUrl = `${getAppUrl()}/portal/${portalToken}`;
      const waMsg = buildCustomerPortalMessage({
        customerName: newCustomer.name,
        companyName: newCustomer.company,
        portalUrl,
      });
      await sendWhatsAppNotification({
        phone: newCustomer.phone,
        recipientName: newCustomer.name,
        message: waMsg,
        triggerType: "CUSTOMER_PORTAL",
        customerId: newCustomer.id,
      });
    } catch (waErr) {
      console.error("[WhatsApp Customer Portal Error]", waErr);
    }
  }

  revalidatePath("/sales");
  revalidatePath("/customers");
  return { success: true, customer: newCustomer, existing: false };
}

// 6. Request Admin Approval to View / Manage Another Client
export async function requestClientAccess(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized: Please log in to request client access.");
  }

  const customerId = formData.get("customerId") as string;
  const reason = formData.get("reason") as string;

  if (!customerId || !reason || reason.trim().length < 5) {
    throw new Error("Please specify the client and provide a clear reason for requesting access.");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { assignedTo: true },
  });

  if (!customer) {
    throw new Error("Client record not found.");
  }

  // Upsert ClientAccessRequest
  const request = await prisma.clientAccessRequest.upsert({
    where: {
      customerId_requestedById: {
        customerId,
        requestedById: session.userId,
      },
    },
    update: {
      reason: reason.trim(),
      status: "PENDING",
      adminRemarks: null,
      reviewedById: null,
    },
    create: {
      customerId,
      requestedById: session.userId,
      reason: reason.trim(),
      status: "PENDING",
    },
    include: {
      requestedBy: true,
      customer: true,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        action: "CLIENT_ACCESS_REQUESTED",
        entityType: "CUSTOMER",
        entityId: customerId,
        userId: session.userId,
        details: `Sales rep ${request.requestedBy.name} requested admin approval to access client "${customer.name}". Reason: ${reason}`,
      },
    });

    const adminHtml = `
      <h2>Client Profile Access Request</h2>
      <p><strong>Sales Representative:</strong> ${request.requestedBy.name} (${request.requestedBy.email})</p>
      <p><strong>Target Client:</strong> ${customer.name} ${customer.company ? `(${customer.company})` : ""}</p>
      <p><strong>Currently Assigned To:</strong> ${customer.assignedTo?.name || "General Pool"}</p>
      <p><strong>Reason Provided:</strong></p>
      <p style="background:#f4f4f5;padding:12px;border-radius:6px;white-space:pre-wrap;">${reason}</p>
      <br/>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/sales?tab=access-requests" style="display:inline-block;padding:10px 18px;background:#635bff;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
        Review & Approve Request in Admin Console
      </a>
    `;
    await sendAdminNotification(`Client Access Request: ${customer.name} by ${request.requestedBy.name}`, adminHtml);
  } catch (err) {
    console.error("Non-blocking notification error:", err);
  }

  revalidatePath("/sales");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return { success: true, id: request.id };
}

// 7. Admin Review Client Access Request (Approve / Reject)
export async function reviewClientAccess(
  requestId: string, 
  status: "APPROVED" | "REJECTED", 
  adminRemarks?: string,
  reassignClient: boolean = false
) {
  const session = await getSession();
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HEAD"].includes(session?.role as string);

  if (!session?.userId || !isAdmin) {
    throw new Error("Unauthorized: Only Super Admin and Administrators can approve client access.");
  }

  const existingRequest = await prisma.clientAccessRequest.findUnique({
    where: { id: requestId },
    include: { customer: true, requestedBy: true },
  });

  if (!existingRequest) {
    throw new Error("Access request not found.");
  }

  const updated = await prisma.clientAccessRequest.update({
    where: { id: requestId },
    data: {
      status,
      adminRemarks: adminRemarks?.trim() || (status === "APPROVED" ? "Approved by Admin" : "Denied by Admin"),
      reviewedById: session.userId,
    },
  });

  // If approved and reassignClient is toggled, update customer.assignedToId
  if (status === "APPROVED" && reassignClient) {
    await prisma.customer.update({
      where: { id: existingRequest.customerId },
      data: { assignedToId: existingRequest.requestedById },
    });
  }

  try {
    await prisma.activityLog.create({
      data: {
        action: `CLIENT_ACCESS_${status}`,
        entityType: "CUSTOMER",
        entityId: existingRequest.customerId,
        userId: session.userId,
        details: `Admin ${session.name} ${status.toLowerCase()} client access for ${existingRequest.requestedBy.name} on ${existingRequest.customer.name}.`,
      },
    });

    if (existingRequest.requestedBy.email) {
      const emailContent = `
        <p>Dear ${existingRequest.requestedBy.name},</p>
        <p>Your request to access client <strong>${existingRequest.customer.name}</strong> has been <strong>${status}</strong> by ${session.name}.</p>
        ${adminRemarks ? `<p><strong>Admin Remarks:</strong> ${adminRemarks}</p>` : ""}
        ${status === "APPROVED" ? `<p>You can now view this client's full details and submit quotations, invoices, projects, and services for them.</p>` : ""}
      `;
      const html = generateTechnextEmailHtml(
        `Client Access ${status}: ${existingRequest.customer.name}`,
        emailContent,
        { text: "Open Sales Portal", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/sales` }
      );
      await sendEmail(existingRequest.requestedBy.email, `TechNext: Client Access ${status} - ${existingRequest.customer.name}`, html);
    }
  } catch (err) {
    console.error("Non-blocking notification error:", err);
  }

  revalidatePath("/sales");
  revalidatePath("/customers");
  revalidatePath(`/customers/${existingRequest.customerId}`);
  return { success: true };
}

// 8. 1-Click Send Customer Portal Link via WhatsApp
export async function dispatchCustomerPortalWhatsApp(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer || !customer.phone) {
    throw new Error("Customer or phone number not found.");
  }

  let token = customer.portalToken;
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
    await prisma.customer.update({
      where: { id: customer.id },
      data: { portalToken: token },
    });
  }

  const portalUrl = `${getAppUrl()}/portal/${token}`;
  const message = buildCustomerPortalMessage({
    customerName: customer.name,
    companyName: customer.company,
    portalUrl,
  });

  const result = await sendWhatsAppNotification({
    phone: customer.phone,
    recipientName: customer.name,
    message,
    triggerType: "CUSTOMER_PORTAL",
    customerId: customer.id,
    forceSend: true,
  });

  const waLink = getWhatsAppLink(customer.phone, message);

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/sales");
  return { success: true, result, waLink, message };
}

// 9. 1-Click Send Google Review Request via WhatsApp
export async function dispatchCustomerReviewWhatsApp(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer || !customer.phone) {
    throw new Error("Customer or phone number not found.");
  }

  const message = buildCustomerReviewMessage({
    customerName: customer.name,
  });

  const result = await sendWhatsAppNotification({
    phone: customer.phone,
    recipientName: customer.name,
    message,
    triggerType: "CUSTOMER_REVIEW",
    customerId: customer.id,
    forceSend: true,
  });

  const waLink = getWhatsAppLink(customer.phone, message);

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/sales");
  return { success: true, result, waLink, message };
}
