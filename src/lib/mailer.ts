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
