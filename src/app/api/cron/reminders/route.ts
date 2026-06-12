export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateTechNextEmailHtml } from "@/lib/mailer";

export async function GET(req: Request) {
  // Verify Vercel Cron Secret for security
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.systemSettings.findFirst();
  if (!settings?.smtpEmail || !settings?.smtpPassword) {
    return NextResponse.json({ success: false, error: "SMTP not configured" }, { status: 500 });
  }

  const results: string[] = [];

  try {
    // 1. Follow-ups due tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        status: "PENDING",
        date: { gte: tomorrowStart, lte: tomorrowEnd }
      },
      include: { customer: true, assignedTo: true }
    });

    for (const fu of dueFollowUps) {
      // Email to employee
      if (fu.assignedTo.email) {
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Upcoming Follow-up</h2>
          <p>You have a <strong>${fu.type}</strong> scheduled with <strong>${fu.customer.name}</strong> for <strong>tomorrow (${tomorrowStart.toLocaleDateString()})</strong>.</p>
          ${fu.notes ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;"><p style="margin: 0; color: #92400e; font-size: 15px;"><strong>Notes:</strong> ${fu.notes}</p></div>` : ''}
        `;
        await sendEmail(
          fu.assignedTo.email,
          `⏰ Follow-up Reminder: ${fu.customer.name} — ${fu.type}`,
          generateTechNextEmailHtml("Employee Reminder", bodyHtml)
        );
      }
      // Email to customer
      if (fu.customer.email) {
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Hello ${fu.customer.name},</h2>
          <p style="font-size: 16px;">This is a friendly reminder about your scheduled <strong>${fu.type}</strong> with us on <strong>${tomorrowStart.toLocaleDateString()}</strong>.</p>
          <p style="font-size: 16px;">We look forward to speaking with you!</p>
        `;
        await sendEmail(
          fu.customer.email,
          `Reminder: Upcoming ${fu.type} with TechNext Technologies`,
          generateTechNextEmailHtml("Upcoming Appointment", bodyHtml)
        );
      }
      results.push(`Follow-up reminder: ${fu.customer.name}`);
    }

    // 2. Renewals expiring in 7 days
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7Start = new Date(new Date().setHours(0, 0, 0, 0));
    const in7End = new Date(in7Days.setHours(23, 59, 59, 999));

    const expiringRenewals = await prisma.renewal.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: { gte: in7Start, lte: in7End }
      },
      include: { customer: true }
    });

    for (const r of expiringRenewals) {
      if (r.customer.email) {
        const daysLeft = Math.ceil((r.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Hello ${r.customer.name},</h2>
          <p style="font-size: 16px;">Your <strong>${r.type}</strong> service is expiring on <strong>${r.expiryDate.toLocaleDateString()}</strong> (${daysLeft} days from now).</p>
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 500;">Please contact us to renew your service and avoid any disruption.</p>
          </div>
        `;
        await sendEmail(
          r.customer.email,
          `⚠️ Renewal Alert: Your ${r.type} expires in ${daysLeft} days`,
          generateTechNextEmailHtml("Service Expiration Warning", bodyHtml)
        );
        results.push(`Renewal alert: ${r.customer.name} — ${r.type}`);
      }

      // Also email admin
      if (settings.smtpEmail) {
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Renewal Expiring Soon</h2>
          <p style="font-size: 16px;"><strong>${r.customer.name}</strong>'s <strong>${r.type}</strong> service expires on ${r.expiryDate.toLocaleDateString()}.</p>
        `;
        await sendEmail(
          settings.smtpEmail,
          `🔄 Renewal Expiring: ${r.customer.name} — ${r.type}`,
          generateTechNextEmailHtml("Action Required", bodyHtml)
        );
      }
    }

    // 3. Quotations pending > 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const staleQuotations = await prisma.quotation.findMany({
      where: {
        status: "SENT",
        updatedAt: { lte: threeDaysAgo }
      },
      include: { customer: true }
    });

    for (const q of staleQuotations) {
      if (settings.smtpEmail) {
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Quotation Pending Response</h2>
          <p style="font-size: 16px;">Quotation <strong>${q.quotationNumber}</strong> for <strong>${q.customer.name}</strong> (₹${q.totalAmount.toFixed(2)}) was sent over 3 days ago and is still pending.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 500;">Please consider following up with the customer directly.</p>
          </div>
        `;
        await sendEmail(
          settings.smtpEmail,
          `📋 Quotation Follow-up: ${q.quotationNumber} — ${q.customer.name}`,
          generateTechNextEmailHtml("Follow-up Reminder", bodyHtml)
        );
        results.push(`Stale quotation: ${q.quotationNumber}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} reminders`,
      details: results
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
