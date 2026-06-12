export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

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
        await sendEmail(
          fu.assignedTo.email,
          `⏰ Follow-up Reminder: ${fu.customer.name} — ${fu.type}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#0A2540;">Follow-up Reminder</h2>
            <p>You have a <strong>${fu.type}</strong> scheduled with <strong>${fu.customer.name}</strong> for <strong>tomorrow (${tomorrowStart.toLocaleDateString()})</strong>.</p>
            ${fu.notes ? `<p><em>Notes: ${fu.notes}</em></p>` : ''}
            <p style="color:#6B7280;font-size:13px;">— TechNext CRM Auto-Reminder</p>
          </div>`
        );
      }
      // Email to customer
      if (fu.customer.email) {
        await sendEmail(
          fu.customer.email,
          `Reminder: Upcoming ${fu.type} with TechNext Technologies`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#0A2540;">TechNext Technologies</h2>
            <p>Dear ${fu.customer.name},</p>
            <p>This is a friendly reminder about your scheduled <strong>${fu.type}</strong> with us on <strong>${tomorrowStart.toLocaleDateString()}</strong>.</p>
            <p>We look forward to speaking with you!</p>
            <p style="margin-top:24px;color:#6B7280;font-size:13px;">Best regards,<br>TechNext Technologies Team</p>
          </div>`
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
        await sendEmail(
          r.customer.email,
          `⚠️ Renewal Alert: Your ${r.type} expires in ${daysLeft} days`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#0A2540;">TechNext Technologies</h2>
            <p>Dear ${r.customer.name},</p>
            <p>Your <strong>${r.type}</strong> service is expiring on <strong>${r.expiryDate.toLocaleDateString()}</strong> (${daysLeft} days from now).</p>
            <p>Please contact us to renew your service and avoid any disruption.</p>
            <p style="margin-top:24px;color:#6B7280;font-size:13px;">Best regards,<br>TechNext Technologies Team</p>
          </div>`
        );
        results.push(`Renewal alert: ${r.customer.name} — ${r.type}`);
      }

      // Also email admin
      if (settings.smtpEmail) {
        await sendEmail(
          settings.smtpEmail,
          `🔄 Renewal Expiring: ${r.customer.name} — ${r.type}`,
          `<div style="font-family:Arial,sans-serif;padding:24px;">
            <h2>Renewal Expiring Soon</h2>
            <p><strong>${r.customer.name}</strong>'s <strong>${r.type}</strong> expires on ${r.expiryDate.toLocaleDateString()}.</p>
          </div>`
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
        await sendEmail(
          settings.smtpEmail,
          `📋 Quotation Follow-up: ${q.quotationNumber} — ${q.customer.name}`,
          `<div style="font-family:Arial,sans-serif;padding:24px;">
            <h2>Quotation Pending Response</h2>
            <p>Quotation <strong>${q.quotationNumber}</strong> for <strong>${q.customer.name}</strong> (₹${q.totalAmount.toFixed(2)}) was sent over 3 days ago and is still pending.</p>
            <p>Consider following up with the customer.</p>
          </div>`
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
