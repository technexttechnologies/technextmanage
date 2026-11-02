"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { 
  sendWhatsAppNotification, 
  buildProjectUpdateMessage, 
  buildServiceRequestMessage,
  buildCustomerReviewMessage, 
  buildCustomerPortalMessage,
  cleanPhoneNumber,
  getWhatsAppLink,
  getAppUrl,
  WhatsAppTriggerType 
} from "@/lib/whatsapp";

export async function saveWhatsAppSettings(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized: Only administrators can update WhatsApp settings.");
  }

  const whatsappProvider = (formData.get("whatsappProvider") as string) || "OFF";
  const whatsappApiUrl = (formData.get("whatsappApiUrl") as string) || null;
  const whatsappInstanceId = (formData.get("whatsappInstanceId") as string) || null;
  const whatsappApiKey = (formData.get("whatsappApiKey") as string) || null;
  const whatsappSenderNumber = (formData.get("whatsappSenderNumber") as string) || null;
  const googleReviewUrl = (formData.get("googleReviewUrl") as string) || "https://g.page/r/Cb3TAmXgJGHWEBM/review";

  const waAutoProjectUpdate = formData.get("waAutoProjectUpdate") === "on";
  const waAutoServiceRequest = formData.get("waAutoServiceRequest") === "on";
  const waAutoCustomerReview = formData.get("waAutoCustomerReview") === "on";
  const waAutoCustomerPortal = formData.get("waAutoCustomerPortal") === "on";
  const waAutoInvoice = formData.get("waAutoInvoice") === "on";

  const existing = await prisma.systemSettings.findFirst();

  if (existing) {
    await prisma.systemSettings.update({
      where: { id: existing.id },
      data: {
        whatsappProvider,
        whatsappApiUrl,
        whatsappInstanceId,
        whatsappApiKey,
        whatsappSenderNumber,
        googleReviewUrl,
        waAutoProjectUpdate,
        waAutoServiceRequest,
        waAutoCustomerReview,
        waAutoCustomerPortal,
        waAutoInvoice,
      },
    });
  } else {
    await prisma.systemSettings.create({
      data: {
        whatsappProvider,
        whatsappApiUrl,
        whatsappInstanceId,
        whatsappApiKey,
        whatsappSenderNumber,
        googleReviewUrl,
        waAutoProjectUpdate,
        waAutoServiceRequest,
        waAutoCustomerReview,
        waAutoCustomerPortal,
        waAutoInvoice,
      },
    });
  }

  revalidatePath("/settings/whatsapp");
  revalidatePath("/settings");
  return { success: true };
}

export async function sendTestWhatsAppMessage(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const phone = formData.get("phone") as string;
  const triggerType = (formData.get("triggerType") as string) || "TEST";
  const customMessage = formData.get("customMessage") as string;

  if (!phone) {
    throw new Error("Recipient phone number is required.");
  }

  let message = "";
  if (triggerType === "PROJECT_UPDATE") {
    message = buildProjectUpdateMessage({
      customerName: "Valued Client",
      projectName: "TechNext E-Commerce Portal",
      status: "DEVELOPMENT",
      progress: 65,
      trackingUrl: `${getAppUrl()}/track/demo`,
      customNote: "Payment gateway integration and responsive layout completed."
    });
  } else if (triggerType === "SERVICE_REQUEST") {
    message = buildServiceRequestMessage({
      customerName: "Valued Client",
      serviceName: "Enterprise Website & AMC",
      packageType: "WEBSITE",
      price: 25000,
      contractPeriod: 12,
      portalUrl: `${getAppUrl()}/portal/demo`
    });
  } else if (triggerType === "CUSTOMER_REVIEW") {
    const settings = await prisma.systemSettings.findFirst();
    message = buildCustomerReviewMessage({
      customerName: "Valued Client",
      projectName: "Custom ERP Implementation",
      reviewUrl: settings?.googleReviewUrl || "https://g.page/r/Cb3TAmXgJGHWEBM/review"
    });
  } else if (triggerType === "CUSTOMER_PORTAL") {
    message = buildCustomerPortalMessage({
      customerName: "Valued Client",
      companyName: "TechNext Global Partner",
      portalUrl: `${getAppUrl()}/portal/demo`
    });
  } else {
    message = customMessage || "Hello from TechNext Technologies! This is an automated test notification verifying your WhatsApp messaging automation setup.";
  }

  const result = await sendWhatsAppNotification({
    phone,
    recipientName: "Test Recipient",
    message,
    triggerType: triggerType as WhatsAppTriggerType,
    forceSend: true,
  });

  const waLink = getWhatsAppLink(phone, message);

  revalidatePath("/settings/whatsapp");
  return {
    success: result.success,
    status: result.status,
    provider: result.provider,
    error: result.error,
    waLink,
    message,
  };
}
