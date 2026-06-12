import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export async function getTransporter() {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings || !settings.smtpEmail || !settings.smtpPassword) {
    throw new Error('Email not configured. Go to Settings and add Gmail credentials.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: settings.smtpEmail,
      pass: settings.smtpPassword,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings?.smtpEmail || !settings?.smtpPassword) {
    await prisma.emailLog.create({
      data: { to, subject, body: html, status: 'FAILED', error: 'SMTP not configured' }
    });
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"TechNext Technologies" <${settings.smtpEmail}>`,
      to,
      subject,
      html,
      attachments,
    });

    await prisma.emailLog.create({
      data: { to, subject, body: html, status: 'SENT' }
    });
    return { success: true };
  } catch (error: any) {
    await prisma.emailLog.create({
      data: { to, subject, body: html, status: 'FAILED', error: error.message }
    });
    return { success: false, error: error.message };
  }
}

export async function sendAdminNotification(subject: string, html: string) {
  return sendEmail('info.technexttech@gmail.com', subject, html);
}

export async function sendCustomerStatusUpdate(customerEmail: string | null, requestType: string, status: string, notes?: string | null, pdfUrl?: string | null) {
  if (!customerEmail) return { success: false, error: 'No customer email provided' };
  
  const subject = `Update on your ${requestType} - TechNext Technologies`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827;">Your ${requestType} Update</h2>
      <p style="font-size: 16px; color: #374151;">The status of your request has been updated to: <strong style="color: #4F46E5;">${status.replace('_', ' ')}</strong></p>
      
      ${notes ? `<div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;"><strong>Update Note:</strong><br>${notes}</div>` : ''}
      
      ${pdfUrl ? `
        <div style="margin: 30px 0;">
          <a href="${pdfUrl}" style="background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Download ${requestType} Document
          </a>
        </div>
      ` : ''}
      
      <p style="color: #6B7280; font-size: 14px; margin-top: 40px;">
        Best regards,<br>
        <strong>TechNext Technologies Team</strong>
      </p>
    </div>
  `;
  
  return sendEmail(customerEmail, subject, html);
}
