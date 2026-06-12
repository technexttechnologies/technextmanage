import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export function generateTechNextEmailHtml(title: string, bodyContent: string, ctaButton?: { text: string, url: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f4f7fb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { background-color: #f4f7fb; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(10, 37, 64, 0.08); }
        .header { background: linear-gradient(135deg, #0A2540 0%, #1a365d 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden; }
        .header::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%); pointer-events: none; }
        .logo-box { background-color: #ffffff; display: inline-block; padding: 16px 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); transition: transform 0.3s ease; }
        .logo-box:hover { transform: translateY(-3px); }
        .header-title { color: #e0e7ff; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .body-section { padding: 40px 30px; }
        .content { color: #334155; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; }
        .cta-btn { display: inline-block; background: linear-gradient(to right, #4f46e5, #6366f1); color: #ffffff !important; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); text-align: center; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .website-link { color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-box">
              <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" alt="TechNext Logo" style="width: 220px; height: auto; display: block;" />
            </div>
            <p class="header-title">${title}</p>
          </div>
          <div class="body-section">
            <div class="content">
              ${bodyContent}
            </div>
            ${ctaButton ? `
              <div style="text-align: center; margin-top: 35px;">
                <a href="${ctaButton.url}" class="cta-btn">${ctaButton.text}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 12px 0;">
              Thank you for partnering with <strong>TechNext Technologies</strong>
            </p>
            <a href="https://technexttechnologies.in" class="website-link">technexttechnologies.in</a>
            <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">
              If you have any questions, please reply directly to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

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
  const finalHtml = generateTechNextEmailHtml("Admin Notification", html);
  return sendEmail('info.technexttech@gmail.com', subject, finalHtml);
}

export async function sendCustomerStatusUpdate(customerEmail: string | null, requestType: string, status: string, notes?: string | null, pdfUrl?: string | null, requestId?: string) {
  if (!customerEmail) return { success: false, error: 'No customer email provided' };
  
  const subject = `Update on your ${requestType} - TechNext Technologies`;
  const trackingUrl = requestId ? `https://technextmanage.vercel.app/track/${requestId}` : null;
  
  const bodyContent = `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Hello,</h2>
    <p>We are writing to inform you that the status of your <strong>${requestType}</strong> has been updated to:</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <span style="display: inline-block; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #4338ca; font-weight: 700; padding: 14px 30px; border-radius: 50px; font-size: 18px; border: 1px solid #a5b4fc; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        ${status.replace(/_/g, ' ')}
      </span>
    </div>
    
    ${notes ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Update Note</h3>
        <p style="margin: 0; color: #475569; font-size: 15px;">${notes}</p>
      </div>
    ` : ''}
    
    ${pdfUrl ? `
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(to bottom, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 12px;">
        <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px;">Your Official Document is Ready</h3>
        <a href="${pdfUrl}" style="background: linear-gradient(to right, #16a34a, #15803d); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
          Download ${requestType}
        </a>
      </div>
    ` : ''}
  `;
  
  const finalHtml = generateTechNextEmailHtml(
    "Status Update", 
    bodyContent, 
    trackingUrl ? { text: "View Live Tracking Page", url: trackingUrl } : undefined
  );
  
  return sendEmail(customerEmail, subject, finalHtml);
}
