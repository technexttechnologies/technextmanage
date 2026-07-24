import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function sendErpEmail(mailId: string) {
  const mail = await prisma.erpMail.findUnique({ 
    where: { id: mailId },
    include: { smtpAccount: true }
  });
  
  if (!mail) throw new Error("Mail not found");

  // Fallback to system settings if no specific ERP SMTP account was selected
  let transporterConfig: any;
  let fromAddress: string;

  if (mail.smtpAccount) {
    transporterConfig = {
      host: mail.smtpAccount.host,
      port: mail.smtpAccount.port,
      secure: mail.smtpAccount.port === 465,
      auth: {
        user: mail.smtpAccount.email,
        pass: mail.smtpAccount.password,
      }
    };
    fromAddress = `"${mail.smtpAccount.name}" <${mail.smtpAccount.email}>`;
  } else {
    // Fallback to main CRM SMTP
    const settings = await prisma.systemSettings.findFirst();
    if (!settings || !settings.smtpEmail || !settings.smtpPassword) {
      throw new Error("No SMTP account configured in either ERP or System Settings.");
    }
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: settings.smtpEmail,
        pass: settings.smtpPassword,
      }
    };
    fromAddress = `"TechNext Operations" <${settings.smtpEmail}>`;
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  // Parse attachments
  let attachments = [];
  if (mail.attachments) {
    try {
      // Assuming attachments are saved as JSON string of { filename, content: base64, encoding, contentType }
      const parsed = JSON.parse(mail.attachments);
      if (Array.isArray(parsed)) {
        attachments = parsed;
      }
    } catch(e) {}
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: mail.recipient,
      cc: mail.cc || undefined,
      bcc: mail.bcc || undefined,
      subject: mail.subject,
      html: mail.body,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64',
        contentType: att.contentType
      }))
    });

    await prisma.erpMail.update({
      where: { id: mailId },
      data: { status: "SENT", deliveredAt: new Date() }
    });
    
    return true;
  } catch (err: any) {
    console.error("ERP Mailer Error:", err);
    await prisma.erpMail.update({
      where: { id: mailId },
      data: { status: "FAILED", retryCount: mail.retryCount + 1 }
    });
    throw err;
  }
}
