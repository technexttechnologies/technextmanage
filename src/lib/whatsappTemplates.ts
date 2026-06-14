export function getWhatsAppLink(phone: string | null | undefined, message: string): string {
  if (!phone) return "#";
  // Remove all non-numeric characters (e.g., spaces, dashes, parentheses)
  let cleanPhone = phone.replace(/\D/g, "");
  // If it's a 10 digit Indian number, prefix with 91
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const waTemplates = {
  quotation: (customerName: string, quoteNo: string, amount: number, pdfUrl?: string) => 
    `Hello ${customerName},\n\nWe have prepared your official quotation *${quoteNo}* for a total of *₹${amount.toLocaleString()}*.\n\n${pdfUrl ? `You can download the full PDF here: ${pdfUrl}\n\n` : ''}Let us know if you have any questions!\n\nBest regards,\n*Technext Technologies*`,
    
  packageActivation: (customerName: string, packageName: string, packageType: string) =>
    `Hello ${customerName} 🎉\n\nGreat news! Your *${packageName}* (${packageType}) package has been successfully activated.\n\nOur team will be in touch shortly to begin the next steps.\n\nBest regards,\n*Technext Technologies*`,
    
  domainRegistration: (customerName: string, domainName: string, expiryDate: Date) =>
    `Hello ${customerName} 🌐\n\nYour domain *${domainName}* has been successfully registered!\n\nIt is set to expire on *${expiryDate.toLocaleDateString()}*. We will send you a reminder when it's time to renew.\n\nBest regards,\n*Technext Technologies*`,
    
  hostingProvisioning: (customerName: string, hostingPlan: string) =>
    `Hello ${customerName} 🚀\n\nYour hosting environment is now live!\n\nPlan: *${hostingPlan}*\nYour SSL Certificates and automated backups have been successfully enabled.\n\nBest regards,\n*Technext Technologies*`,
    
  projectUpdate: (customerName: string, projectName: string, status: string, progress: number) =>
    `Hello ${customerName} 📊\n\nQuick update on your project: *${projectName}*.\n\nCurrent Phase: *${status}*\nProgress: *${progress}%*\n\nIf you have any questions, feel free to reply here!\n\nBest regards,\n*Technext Technologies*`,
    
  portalShare: (customerName: string, portalUrl: string) =>
    `Hello ${customerName} 👋\n\nHere is your secure client portal link where you can track your projects, invoices, domains, and service packages:\n\n🔗 ${portalUrl}\n\nPlease keep this link secure. Let us know if you need any help!\n\nBest regards,\n*Technext Technologies*`
};
