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

export async function sendCustomerStatusUpdate(customerEmail: string | null, requestType: string, status: string, notes?: string | null, pdfUrl?: string | null, requestId?: string) {
  if (!customerEmail) return { success: false, error: 'No customer email provided' };
  
  const subject = `Update on your ${requestType} - TechNext Technologies`;
  const trackingUrl = requestId ? `https://technextmanage1.vercel.app/track/${requestId}` : null;
  
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TechNext Technologies</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Document Status Update</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px;">Hello,</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            We are writing to inform you that the status of your <strong>${requestType}</strong> has been updated to:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #eef2ff; color: #4f46e5; font-weight: 700; padding: 12px 24px; border-radius: 50px; font-size: 18px; border: 1px solid #c7d2fe;">
              ${status.replace(/_/g, ' ')}
            </span>
          </div>
          
          ${notes ? `
            <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Update Note</h3>
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">${notes}</p>
            </div>
          ` : ''}
          
          ${pdfUrl ? `
            <div style="text-align: center; margin: 40px 0; padding: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
              <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px;">Your Document is Ready</h3>
              <a href="${pdfUrl}" style="background-color: #16a34a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Download ${requestType}
              </a>
            </div>
          ` : ''}
          
          ${trackingUrl ? `
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px; margin-bottom: 12px;">You can view the full progress of your request at any time:</p>
              <a href="${trackingUrl}" style="color: #4f46e5; font-weight: 600; text-decoration: none; font-size: 15px;">
                View Live Tracking Page &rarr;
              </a>
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
            Thank you for choosing <strong>TechNext Technologies</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            If you have any questions, simply reply to this email.
          </p>
        </div>
        
      </div>
    </div>
  `;
  
  return sendEmail(customerEmail, subject, html);
}
