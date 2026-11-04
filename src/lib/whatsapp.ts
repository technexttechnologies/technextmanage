import { prisma } from "@/lib/prisma";

export function cleanPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";

  // Strip leading zeroes e.g. 09876543210 -> 9876543210
  digits = digits.replace(/^0+/, "");

  // If number was accidentally double-prefixed with 9191 e.g. 91919876543210 (14+ digits)
  while (digits.startsWith("9191") && digits.length >= 14) {
    digits = digits.slice(2);
  }

  // If number has 910... (13 digits: 91 + 0 + 10 digits)
  if (digits.startsWith("910") && digits.length === 13) {
    digits = "91" + digits.slice(3);
  }

  // If already has 91 country code and 12 digits total (91 + 10-digit Indian number)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  // If 10 digits (standard Indian mobile number without country code)
  if (digits.length === 10) {
    return "91" + digits;
  }

  return digits;
}

export function getWhatsAppLink(phone: string | null | undefined, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return "#";
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function buildPaymentReminderMessage(params: {
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  pendingAmount: number;
  dueDate?: string;
  viewUrl?: string;
}): string {
  let msg = `Hello ${params.customerName} 👋,\n\n`;
  msg += `This is a friendly payment reminder from *TechNext Technologies* regarding Invoice *#${params.invoiceNumber}*.\n\n`;
  msg += `📄 *Invoice Number:* ${params.invoiceNumber}\n`;
  msg += `💰 *Total Amount:* ₹${params.totalAmount.toLocaleString("en-IN")}\n`;
  msg += `⚠️ *Pending Balance:* ₹${params.pendingAmount.toLocaleString("en-IN")}\n`;
  if (params.dueDate) {
    msg += `📅 *Due Date:* ${params.dueDate}\n`;
  }
  if (params.viewUrl) {
    msg += `\n🔗 *View & Pay Online:* ${params.viewUrl}\n`;
  }
  msg += `\nPlease arrange the payment at your earliest convenience.\nIf you have already processed this payment, please disregard this reminder.\n\nThank you for choosing TechNext Technologies!\n*TechNext Technologies*`;
  return msg;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://technextmanage.vercel.app";
}

// ----------------------------------------------------
// Message Builders
// ----------------------------------------------------

export function buildProjectUpdateMessage(params: {
  customerName: string;
  projectName: string;
  status: string;
  progress: number;
  trackingUrl?: string;
  milestoneTitle?: string;
  customNote?: string;
}): string {
  const formattedStatus = params.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const progressBars = "▓".repeat(Math.round(params.progress / 10)) + "░".repeat(10 - Math.round(params.progress / 10));

  let msg = `Hello ${params.customerName} 👋,\n\n`;
  msg += `*Project Status Update* from *Technext Technologies*\n\n`;
  msg += `📁 *Project:* ${params.projectName}\n`;
  msg += `🔄 *Current Stage:* ${formattedStatus}\n`;
  msg += `📊 *Progress:* ${params.progress}% [${progressBars}]\n`;

  if (params.milestoneTitle) {
    msg += `✅ *Milestone Completed:* ${params.milestoneTitle}\n`;
  }
  if (params.customNote) {
    msg += `📝 *Note:* ${params.customNote}\n`;
  }
  if (params.trackingUrl) {
    msg += `\n🔗 *Live Tracking Link:* ${params.trackingUrl}\n`;
  }

  msg += `\nIf you have any questions, feel free to reply directly to this message.\n\nBest regards,\n*Technext Technologies*`;
  return msg;
}

export function buildServiceRequestMessage(params: {
  customerName: string;
  serviceName: string;
  packageType: string;
  price?: number;
  contractPeriod?: number;
  isLifetime?: boolean;
  portalUrl?: string;
}): string {
  let msg = `Hello ${params.customerName} 🎉,\n\n`;
  msg += `Thank you for choosing *Technext Technologies*!\n\n`;
  msg += `Your service package has been successfully booked & activated:\n`;
  msg += `📦 *Package:* ${params.serviceName}\n`;
  msg += `🏷️ *Type:* ${params.packageType}\n`;

  if (params.price !== undefined && params.price > 0) {
    msg += `💰 *Amount:* ₹${params.price.toLocaleString("en-IN")}\n`;
  }
  if (params.isLifetime) {
    msg += `⏳ *Term:* Lifetime Access\n`;
  } else if (params.contractPeriod) {
    msg += `⏳ *Term:* ${params.contractPeriod} Months\n`;
  }

  if (params.portalUrl) {
    msg += `\n🔗 *Access Your Client Portal:* ${params.portalUrl}\n`;
  }

  msg += `\nOur technical team is assigned and ready to assist you.\n\nBest regards,\n*Technext Technologies*`;
  return msg;
}

export function buildCustomerReviewMessage(params: {
  customerName: string;
  projectName?: string;
  reviewUrl?: string;
}): string {
  const url = params.reviewUrl || "https://g.page/r/Cb3TAmXgJGHWEBM/review";
  let msg = `Dear ${params.customerName} ⭐,\n\n`;
  msg += `Thank you for partnering with *Technext Technologies*${params.projectName ? ` on *${params.projectName}*` : ""}!\n\n`;
  msg += `We strive to deliver exceptional digital solutions. Your feedback means the world to our team.\n\n`;
  msg += `Would you take 30 seconds to share your experience with a quick 5-star Google review?\n\n`;
  msg += `🌟 *Click here to leave a review:*\n${url}\n\n`;
  msg += `Thank you for your trust and support!\n\nWarm regards,\n*Technext Technologies Team*`;
  return msg;
}

export function buildCustomerPortalMessage(params: {
  customerName: string;
  companyName?: string | null;
  portalUrl: string;
}): string {
  let msg = `Hello ${params.customerName} 👋,\n\n`;
  msg += `Welcome to your *Secure Client Portal* at *Technext Technologies*.\n\n`;
  if (params.companyName) {
    msg += `🏢 *Account:* ${params.companyName}\n`;
  }
  msg += `\nFrom your dedicated portal, you can:\n`;
  msg += `• Track live project progress & milestones\n`;
  msg += `• Review and approve quotations\n`;
  msg += `• Download tax invoices & receipts\n`;
  msg += `• Submit technical support tickets directly\n`;
  msg += `• Manage active domains & service packages\n\n`;
  msg += `🔗 *Access Portal Link:* ${params.portalUrl}\n\n`;
  msg += `_Please bookmark this link for convenient future access._\n\nBest regards,\n*Technext Technologies*`;
  return msg;
}

export function buildInvoiceNotificationMessage(params: {
  customerName: string;
  invoiceNo?: string;
  amount: number;
  trackingUrl: string;
}): string {
  let msg = `Hello ${params.customerName} 🧾,\n\n`;
  msg += `Your invoice${params.invoiceNo ? ` *#${params.invoiceNo}*` : ""} from *Technext Technologies* is ready.\n\n`;
  msg += `💰 *Amount Due:* ₹${params.amount.toLocaleString("en-IN")}\n`;
  msg += `🔗 *View & Pay Online:* ${params.trackingUrl}\n\n`;
  msg += `Let us know if you need any assistance!\n\nBest regards,\n*Technext Technologies*`;
  return msg;
}

export function buildQuotationNotificationMessage(params: {
  customerName: string;
  quoteNo: string;
  amount: number;
  trackingUrl?: string;
}): string {
  let msg = `Hello ${params.customerName} 📋,\n\n`;
  msg += `We have prepared your official quotation *${params.quoteNo}*.\n\n`;
  msg += `💰 *Total Estimated Amount:* ₹${params.amount.toLocaleString("en-IN")}\n`;
  if (params.trackingUrl) {
    msg += `🔗 *Review & Approve Quotation:* ${params.trackingUrl}\n`;
  }
  msg += `\nFeel free to reach out if you have any questions or customization requests.\n\nBest regards,\n*Technext Technologies*`;
  return msg;
}

// ----------------------------------------------------
// Dispatch Service with Multi-Gateway & Simulation
// ----------------------------------------------------

export type WhatsAppTriggerType = 
  | "PROJECT_UPDATE"
  | "SERVICE_REQUEST"
  | "CUSTOMER_REVIEW"
  | "CUSTOMER_PORTAL"
  | "INVOICE"
  | "QUOTATION"
  | "TICKET"
  | "MANUAL"
  | "TEST";

export interface SendWhatsAppArgs {
  phone: string | null | undefined;
  recipientName?: string | null;
  message: string;
  triggerType: WhatsAppTriggerType;
  customerId?: string | null;
  forceSend?: boolean; // bypasses auto toggles if user clicked send directly
}

export interface SendWhatsAppResult {
  success: boolean;
  status: "SENT" | "SIMULATED" | "FAILED";
  provider: string;
  error?: string;
  logId?: string;
}

export async function sendWhatsAppNotification(args: SendWhatsAppArgs): Promise<SendWhatsAppResult> {
  const cleanedPhone = cleanPhoneNumber(args.phone);

  if (!cleanedPhone || cleanedPhone.length < 10) {
    console.warn(`[WhatsApp] Invalid phone number skipped: "${args.phone}" for ${args.recipientName || "customer"}`);
    return {
      success: false,
      status: "FAILED",
      provider: "NONE",
      error: `Invalid phone number: ${args.phone || "empty"}`
    };
  }

  try {
    const settings = await prisma.systemSettings.findFirst();

    // Check automation toggle unless forced
    if (!args.forceSend && settings) {
      if (args.triggerType === "PROJECT_UPDATE" && !settings.waAutoProjectUpdate) {
        return { success: true, status: "SIMULATED", provider: "DISABLED_BY_SETTING" };
      }
      if (args.triggerType === "SERVICE_REQUEST" && !settings.waAutoServiceRequest) {
        return { success: true, status: "SIMULATED", provider: "DISABLED_BY_SETTING" };
      }
      if (args.triggerType === "CUSTOMER_REVIEW" && !settings.waAutoCustomerReview) {
        return { success: true, status: "SIMULATED", provider: "DISABLED_BY_SETTING" };
      }
      if (args.triggerType === "CUSTOMER_PORTAL" && !settings.waAutoCustomerPortal) {
        return { success: true, status: "SIMULATED", provider: "DISABLED_BY_SETTING" };
      }
      if ((args.triggerType === "INVOICE" || args.triggerType === "QUOTATION") && !settings.waAutoInvoice) {
        return { success: true, status: "SIMULATED", provider: "DISABLED_BY_SETTING" };
      }
    }

    const provider = settings?.whatsappProvider || "OFF";
    let finalStatus: "SENT" | "SIMULATED" | "FAILED" = "SIMULATED";
    let errorDetail: string | undefined;

    if (provider === "META" && settings?.whatsappInstanceId && settings?.whatsappApiKey) {
      // Official Meta WhatsApp Cloud API
      const metaUrl = `https://graph.facebook.com/v19.0/${settings.whatsappInstanceId}/messages`;
      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.whatsappApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanedPhone,
          type: "text",
          text: { preview_url: true, body: args.message }
        })
      });

      if (response.ok) {
        finalStatus = "SENT";
      } else {
        const errorText = await response.text();
        finalStatus = "FAILED";
        errorDetail = `Meta API error (${response.status}): ${errorText}`;
        console.error("[WhatsApp] Meta API error:", errorDetail);
      }
    } else if (provider === "ULTRAMSG" && settings?.whatsappInstanceId && settings?.whatsappApiKey) {
      // UltraMsg WhatsApp Gateway
      const ultraUrl = `https://api.ultramsg.com/${settings.whatsappInstanceId}/messages/chat`;
      const params = new URLSearchParams();
      params.append("token", settings.whatsappApiKey);
      params.append("to", cleanedPhone);
      params.append("body", args.message);

      const response = await fetch(ultraUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sent === "true" || data.sent === true || data.id) {
          finalStatus = "SENT";
        } else {
          finalStatus = "FAILED";
          errorDetail = `UltraMsg response error: ${JSON.stringify(data)}`;
        }
      } else {
        const errorText = await response.text();
        finalStatus = "FAILED";
        errorDetail = `UltraMsg HTTP error (${response.status}): ${errorText}`;
      }
    } else if (provider === "GENERIC" && settings?.whatsappApiUrl) {
      // Generic Webhook / Gateway
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (settings.whatsappApiKey) {
        headers["Authorization"] = `Bearer ${settings.whatsappApiKey}`;
      }

      const response = await fetch(settings.whatsappApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: cleanedPhone,
          message: args.message,
          recipientName: args.recipientName,
          triggerType: args.triggerType,
          customerId: args.customerId
        })
      });

      if (response.ok) {
        finalStatus = "SENT";
      } else {
        finalStatus = "FAILED";
        errorDetail = `Generic gateway error (${response.status}): ${await response.text()}`;
      }
    } else {
      // Provider is OFF or unconfigured. Simulated for audit log and 1-click wa.me action.
      finalStatus = "SIMULATED";
      errorDetail = "Gateway is set to OFF/Manual. Message logged and ready for 1-click WhatsApp Web delivery.";
    }

    // Persist WhatsApp Log in database
    const log = await prisma.whatsAppLog.create({
      data: {
        phone: cleanedPhone,
        recipientName: args.recipientName || null,
        message: args.message,
        triggerType: args.triggerType,
        status: finalStatus,
        provider,
        error: errorDetail || null,
        customerId: args.customerId || null
      }
    });

    return {
      success: finalStatus === "SENT" || finalStatus === "SIMULATED",
      status: finalStatus,
      provider,
      error: errorDetail,
      logId: log.id
    };
  } catch (err: any) {
    console.error("[WhatsApp] Error executing notification:", err);
    try {
      await prisma.whatsAppLog.create({
        data: {
          phone: cleanedPhone,
          recipientName: args.recipientName || null,
          message: args.message,
          triggerType: args.triggerType,
          status: "FAILED",
          provider: "EXCEPTION",
          error: err?.message || String(err),
          customerId: args.customerId || null
        }
      });
    } catch (dbErr) {
      console.error("[WhatsApp] Failed to save error log:", dbErr);
    }

    return {
      success: false,
      status: "FAILED",
      provider: "EXCEPTION",
      error: err?.message || String(err)
    };
  }
}
