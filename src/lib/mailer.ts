import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export function generateTechnextEmailHtml(title: string, bodyContent: string, ctaButton?: { text: string, url: string }) {
  const whatsappNumber = "+919446540984"; 
  const whatsappMessage = encodeURIComponent("Hello, I would like to know more about your services.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        .wrapper { background-color: #f8fafc; padding: 40px 20px; }
        .container { max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; }
        .header { background-color: #ffffff; padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #f1f5f9; position: relative; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%); }
        .logo-box { display: inline-block; margin-bottom: 16px; }
        .header-title { color: #64748b; margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .body-section { padding: 40px 40px; background-color: #ffffff; }
        .content { color: #334155; font-size: 16px; line-height: 1.7; margin: 0; }
        .cta-container { text-align: center; margin-top: 40px; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff !important; font-weight: 600; padding: 16px 36px; text-decoration: none; border-radius: 10px; font-size: 16px; text-align: center; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); transition: transform 0.2s ease; }
        .footer { background-color: #0f172a; padding: 40px 40px; text-align: left; color: #94a3b8; }
        .footer-grid { display: block; width: 100%; margin-bottom: 30px; }
        .footer-col { display: inline-block; vertical-align: top; width: 100%; max-width: 260px; margin-bottom: 20px; }
        .footer-heading { color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: 1px; text-transform: uppercase; }
        .footer-link { color: #cbd5e1; text-decoration: none; font-size: 14px; display: block; margin-bottom: 10px; transition: color 0.2s ease; }
        .footer-link:hover { color: #ffffff; }
        .wa-btn { display: inline-block; background-color: #25D366; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        .copyright { color: #64748b; font-size: 13px; margin: 20px 0 0 0; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; }
        
        @media only screen and (max-width: 600px) {
          .wrapper { padding: 20px 10px; }
          .container { border-radius: 12px; }
          .header { padding: 30px 20px 20px; }
          .body-section { padding: 30px 20px; }
          .footer { padding: 30px 20px; }
          .footer-col { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <!--[if mso | IE]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" >
          <tr>
            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
        <![endif]-->
        <div class="container">
          <div class="header">
            <div class="logo-box">
              <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="technext" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
            </div>
            <p class="header-title">${title}</p>
          </div>
          <div class="body-section">
            <div class="content">
              ${bodyContent}
            </div>
            ${ctaButton ? `
              <div class="cta-container">
                <a href="${ctaButton.url}" class="cta-btn">${ctaButton.text}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <div class="footer-grid">
              <div class="footer-col">
                <h4 class="footer-heading">Contact Us</h4>
                <a href="mailto:info.technexttech@gmail.com" class="footer-link">info.technexttech@gmail.com</a>
                <a href="tel:+919446540984" class="footer-link">+91 9446540984</a>
                <a href="${whatsappUrl}" class="wa-btn">Chat on WhatsApp</a>
              </div>
              <div class="footer-col" style="vertical-align: top;">
                <h4 class="footer-heading">Services</h4>
                <a href="https://technexttechnologies.in" class="footer-link">Custom Software</a>
                <a href="https://technexttechnologies.in" class="footer-link">Mobile Apps</a>
                <a href="https://technexttechnologies.in" class="footer-link">Cloud Infrastructure</a>
                <a href="https://technexttechnologies.in" class="footer-link">IT Consulting</a>
              </div>
            </div>
            <div style="clear: both;"></div>
            <div style="text-align: center;">
              <p class="copyright">&copy; ${new Date().getFullYear()} technext. All rights reserved.</p>
              <p style="color: #475569; font-size: 11px; margin-top: 12px; line-height: 1.5;">
                You are receiving this email because you are a valued client or partner of technext. 
                <br/>If you wish to update your preferences, please contact support.
              </p>
            </div>
          </div>
        </div>
        <!--[if mso | IE]>
            </td>
          </tr>
        </table>
        <![endif]-->
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

  let finalHtml = html;
  if (!html.includes('<!DOCTYPE html>')) {
    finalHtml = generateTechnextEmailHtml(subject, html);
  }

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"technext" <${settings.smtpEmail}>`,
      to,
      subject,
      html: finalHtml,
      attachments,
    });

    await prisma.emailLog.create({
      data: { to, subject, body: finalHtml, status: 'SENT' }
    });
    return { success: true };
  } catch (error: any) {
    await prisma.emailLog.create({
      data: { to, subject, body: finalHtml, status: 'FAILED', error: error.message }
    });
    return { success: false, error: error.message };
  }
}

export async function sendAdminNotification(subject: string, html: string) {
  const finalHtml = generateTechnextEmailHtml("Admin Notification", html);
  return sendEmail('info.technexttech@gmail.com', subject, finalHtml);
}

export async function sendCustomerStatusUpdate(customerEmail: string | null, requestType: string, status: string, notes?: string | null, pdfUrl?: string | null, requestId?: string) {
  if (!customerEmail) return { success: false, error: 'No customer email provided' };
  
  const subject = `Update on your ${requestType} - Technext Technologies`;
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
  
  const finalHtml = generateTechnextEmailHtml(
    "Status Update", 
    bodyContent, 
    trackingUrl ? { text: "View Live Tracking Page", url: trackingUrl } : undefined
  );
  
  return sendEmail(customerEmail, subject, finalHtml);
}
