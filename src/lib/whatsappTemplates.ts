export * from "./whatsapp";
import { getWhatsAppLink } from "./whatsapp";

export { getWhatsAppLink };

export const waTemplates = {
  quotation: (customerName: string, quoteNo: string, amount: number, pdfUrl?: string) => 
    `Hello ${customerName},\n\nWe have prepared your official quotation *${quoteNo}* for a total of *₹${amount.toLocaleString("en-IN")}*.\n\n${pdfUrl ? `You can download the full PDF here: ${pdfUrl}\n\n` : ''}Let us know if you have any questions!\n\nBest regards,\n*Technext Technologies*`,
    
  packageActivation: (customerName: string, packageName: string, packageType: string, portalUrl?: string) =>
    `Hello ${customerName} 🎉\n\nGreat news! Your *${packageName}* (${packageType}) package has been successfully activated.\n\n${portalUrl ? `🔗 Client Portal: ${portalUrl}\n\n` : ''}Our team will be in touch shortly to begin the next steps.\n\nBest regards,\n*Technext Technologies*`,
    
  domainRegistration: (customerName: string, domainName: string, expiryDate: Date) =>
    `Hello ${customerName} 🌐\n\nYour domain *${domainName}* has been successfully registered!\n\nIt is set to expire on *${expiryDate.toLocaleDateString()}*. We will send you a reminder when it's time to renew.\n\nBest regards,\n*Technext Technologies*`,
    
  hostingProvisioning: (customerName: string, hostingPlan: string) =>
    `Hello ${customerName} 🚀\n\nYour hosting environment is now live!\n\nPlan: *${hostingPlan}*\nYour SSL Certificates and automated backups have been successfully enabled.\n\nBest regards,\n*Technext Technologies*`,
    
  projectUpdate: (customerName: string, projectName: string, status: string, progress: number, trackingUrl?: string) =>
    `Hello ${customerName} 📊\n\nQuick update on your project: *${projectName}*.\n\nCurrent Phase: *${status}*\nProgress: *${progress}%*\n${trackingUrl ? `\n🔗 Tracking Link: ${trackingUrl}\n` : ''}\nIf you have any questions, feel free to reply here!\n\nBest regards,\n*Technext Technologies*`,
    
  portalShare: (customerName: string, portalUrl: string) =>
    `Hello ${customerName} 👋\n\nHere is your secure client portal link where you can track your projects, invoices, domains, and service packages:\n\n🔗 ${portalUrl}\n\nPlease keep this link secure. Let us know if you need any help!\n\nBest regards,\n*Technext Technologies*`,

  customerReview: (customerName: string, projectName?: string, reviewUrl?: string) =>
    `Dear ${customerName} ⭐,\n\nThank you for working with *Technext Technologies*${projectName ? ` on *${projectName}*` : ""}! We hope you loved our service.\n\nCould you please take 30 seconds to support us with a Google review?\n\n🌟 Review Link:\n${reviewUrl || "https://g.page/r/Cb3TAmXgJGHWEBM/review"}\n\nThank you for your valuable trust and partnership!\n\nWarm regards,\n*Technext Technologies*`,

  paymentReminder: (customerName: string, invoiceNo: string, totalAmount: number, pendingAmount: number, dueDate?: string, viewUrl?: string) =>
    `Hello ${customerName} 👋,\n\nThis is a friendly payment reminder from *TechNext Technologies* regarding Invoice *#${invoiceNo}*.\n\n📄 *Invoice Number:* ${invoiceNo}\n💰 *Total Amount:* ₹${totalAmount.toLocaleString("en-IN")}\n⚠️ *Pending Balance:* ₹${pendingAmount.toLocaleString("en-IN")}\n${dueDate ? `📅 *Due Date:* ${dueDate}\n` : ""}${viewUrl ? `\n🔗 *View & Pay Online:* ${viewUrl}\n` : ""}\nPlease arrange the payment at your earliest convenience.\nIf you have already processed this payment, please disregard this reminder.\n\nThank you for choosing TechNext Technologies!\n*TechNext Technologies*`
};
