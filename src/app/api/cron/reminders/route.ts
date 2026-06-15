export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";

import { syncEnquiriesFromSheet } from "@/lib/sheetSync";

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
    // 0. Auto-sync Website Enquiries from Google Sheet
    try {
      const syncResult = await syncEnquiriesFromSheet();
      results.push(`Synced Enquiries: ${syncResult.added} new leads added.`);
    } catch (err: any) {
      console.error("Enquiry sync failed:", err);
      results.push(`Enquiry sync failed: ${err.message}`);
    }

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
      if (fu.assignedTo?.email) {
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Upcoming Follow-up</h2>
          <p>You have a <strong>${fu.type}</strong> scheduled with <strong>${fu.customer.name}</strong> for <strong>tomorrow (${tomorrowStart.toLocaleDateString()})</strong>.</p>
          ${fu.notes ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;"><p style="margin: 0; color: #92400e; font-size: 15px;"><strong>Notes:</strong> ${fu.notes}</p></div>` : ''}
        `;
        await sendEmail(
          fu.assignedTo.email,
          `⏰ Follow-up Reminder: ${fu.customer.name} — ${fu.type}`,
          generateTechnextEmailHtml("Employee Reminder", bodyHtml)
        );
      }
      // Email to customer
      if (fu.customer?.email) {
        const bodyHtml = `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Hello ${fu.customer.name},</h2>
          <p style="font-size: 16px;">This is a friendly reminder about your scheduled <strong>${fu.type}</strong> with us on <strong>${tomorrowStart.toLocaleDateString()}</strong>.</p>
          <p style="font-size: 16px;">We look forward to speaking with you!</p>
        `;
        await sendEmail(
          fu.customer.email,
          `Reminder: Upcoming ${fu.type} with Technext Technologies`,
          generateTechnextEmailHtml("Upcoming Appointment", bodyHtml)
        );
      }
      results.push(`Follow-up reminder: ${fu.customer.name}`);
    }

    // 2. Generic Renewals expiring in 7 days (Legacy)
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

    const emailTemplate = await prisma.messageTemplate.findFirst({
      where: { name: "Renewal Expiring", type: "EMAIL" }
    });

    for (const r of expiringRenewals) {
      if (r.customer.email) {
        const daysLeft = Math.ceil((r.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        let subject = emailTemplate?.subject || `⚠️ Renewal Alert: Your ${r.type} expires in ${daysLeft} days`;
        let bodyHtml = emailTemplate?.body || `
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Action Required: Service Renewal</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello <strong>{{customer_name}}</strong>,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">We hope you are enjoying your services with Technext Technologies. This is a gentle reminder that your <strong>{{renewal_type}}</strong> is scheduled to expire in <strong>{{days_left}} days</strong>.</p>
          
          <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0; display: flex; align-items: center; justify-content: center; gap: 16px;">
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Expiration Date</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; color: #0f172a; font-weight: 700;">{{expiry_date}}</p>
            </div>
          </div>

          <p style="font-size: 16px; color: #334155; line-height: 1.6;">To ensure uninterrupted access to your services, please reply to this email or contact our support team at your earliest convenience to process your renewal.</p>
          <p style="font-size: 16px; color: #334155; margin-top: 30px;">Best regards,<br/><strong>technext</strong></p>
        `;

        // Replace variables
        subject = subject.replace(/{{customer_name}}/g, r.customer.name)
                         .replace(/{{renewal_type}}/g, r.type)
                         .replace(/{{days_left}}/g, daysLeft.toString());
        
        bodyHtml = bodyHtml.replace(/{{customer_name}}/g, r.customer.name)
                           .replace(/{{renewal_type}}/g, r.type)
                           .replace(/{{expiry_date}}/g, r.expiryDate.toLocaleDateString())
                           .replace(/{{days_left}}/g, daysLeft.toString());

        await sendEmail(
          r.customer.email,
          subject,
          generateTechnextEmailHtml("Service Expiration Warning", bodyHtml)
        );
        results.push(`Renewal alert: ${r.customer.name} — ${r.type}`);
      }
    }

    // 3. Cascading Expiry Alerts: Domains & Hosting (90/60/30/15/7/1 days)
    const expiryDays = [90, 60, 30, 15, 7, 1];
    for (const days of expiryDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));

      // Domains
      const expiringDomains = await prisma.domainRegistration.findMany({
        where: {
          status: "ACTIVE",
          expiryDate: { gte: start, lte: end }
        },
        include: { customer: true }
      });

      for (const domain of expiringDomains) {
        if (domain.customer?.email) {
          const bodyHtml = `
            <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Action Required: Domain Renewal</h2>
            <p>Hello <strong>${domain.customer.name}</strong>,</p>
            <p>Your domain <strong>${domain.domainName}</strong> is expiring in <strong>${days} days</strong> on ${domain.expiryDate.toLocaleDateString()}.</p>
            <p>To avoid any service interruption, please process the renewal at your earliest convenience.</p>
          `;
          await sendEmail(
            domain.customer.email,
            `⚠️ Domain Expiry Alert: ${domain.domainName} expires in ${days} days`,
            generateTechnextEmailHtml("Domain Renewal", bodyHtml)
          );
          results.push(`Domain Alert (${days}d): ${domain.domainName}`);
          console.log(`Sent Domain Alert to ${domain.customer.email} for ${domain.domainName} - ${days} days`);
        }
      }

      // Hosting
      const expiringHosting = await prisma.hostingAccount.findMany({
        where: {
          status: "ACTIVE",
          isLifetime: false,
          renewalDate: { gte: start, lte: end }
        },
        include: { customer: true }
      });

      for (const host of expiringHosting) {
        if (!host.renewalDate) continue;
        if (host.customer?.email) {
          const bodyHtml = `
            <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Action Required: Hosting Renewal</h2>
            <p>Hello <strong>${host.customer.name}</strong>,</p>
            <p>Your hosting plan <strong>${host.hostingPlan}</strong> from <strong>${host.hostingProvider}</strong> is due for renewal in <strong>${days} days</strong> on ${host.renewalDate.toLocaleDateString()}.</p>
            <p>Please renew your plan to prevent any website downtime.</p>
          `;
          await sendEmail(
            host.customer.email,
            `⚠️ Hosting Renewal Alert: Plan expires in ${days} days`,
            generateTechnextEmailHtml("Hosting Renewal", bodyHtml)
          );
          results.push(`Hosting Alert (${days}d): ${host.hostingPlan}`);
          console.log(`Sent Hosting Alert to ${host.customer.email} for ${host.hostingPlan} - ${days} days`);
        }
      }
    }

    // 4. Lead Drip Campaigns (Day 1/3/7/14)
    const leadDays = [1, 3, 7, 14];
    for (const days of leadDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));

      const leads = await prisma.lead.findMany({
        where: {
          status: { notIn: ["CONVERTED", "LOST"] },
          createdAt: { gte: start, lte: end }
        }
      });

      for (const lead of leads) {
        if (lead.email) {
          let subject = "";
          let bodyHtml = "";
          if (days === 1) {
            subject = `Thank you for reaching out, ${lead.name}!`;
            bodyHtml = `<p>Hi ${lead.name},</p><p>Thank you for expressing interest in Technext Technologies! Our team is currently reviewing your details and will be in touch shortly.</p>`;
          } else if (days === 3) {
            subject = `Checking in on your inquiry, ${lead.name}`;
            bodyHtml = `<p>Hi ${lead.name},</p><p>Just a quick follow-up to see if you had any preliminary questions. We'd love to schedule a quick call at your convenience!</p>`;
          } else if (days === 7) {
            subject = `Explore our Recent Work, ${lead.name}`;
            bodyHtml = `<p>Hi ${lead.name},</p><p>While we await your response, we thought you might be interested in seeing some of our recent successful projects. Check out our portfolio on our website!</p>`;
          } else if (days === 14) {
            subject = `Let's connect, ${lead.name}`;
            bodyHtml = `<p>Hi ${lead.name},</p><p>It's been a couple of weeks since your initial inquiry. If you're still looking for a solution, let's jump on a quick call to discuss how we can help.</p>`;
          }

          await sendEmail(
            lead.email,
            subject,
            generateTechnextEmailHtml("Lead Follow-up", bodyHtml)
          );
          results.push(`Lead Drip (${days}d): ${lead.name}`);
          console.log(`Sent Lead Drip to ${lead.email} - Day ${days}`);
        }
      }
    }

    // 5. Quotation Drip Campaigns (Day 3/7/14)
    const quoteDays = [3, 7, 14];
    for (const days of quoteDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));

      const quotations = await prisma.quotation.findMany({
        where: {
          status: "SENT",
          updatedAt: { gte: start, lte: end }
        },
        include: { customer: true }
      });

      for (const q of quotations) {
        if (q.customer?.email) {
          const subject = `Following up on Quotation ${q.quotationNumber}`;
          const bodyHtml = `
            <p>Hello ${q.customer.name},</p>
            <p>This is a friendly reminder regarding quotation <strong>${q.quotationNumber}</strong> sent ${days} days ago.</p>
            <p>If you have any questions or need further clarifications, please feel free to reach out to us.</p>
          `;
          await sendEmail(
            q.customer.email,
            subject,
            generateTechnextEmailHtml("Quotation Reminder", bodyHtml)
          );
          results.push(`Quotation Drip (${days}d): ${q.quotationNumber}`);
          console.log(`Sent Quotation Drip to ${q.customer.email} for ${q.quotationNumber} - Day ${days}`);
        }
      }
    }

    // 6. Post-Project Campaigns (Day 30/60/90)
    const projectDays = [30, 60, 90];
    for (const days of projectDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));

      const projects = await prisma.project.findMany({
        where: {
          status: "COMPLETED",
          updatedAt: { gte: start, lte: end }
        },
        include: { customer: true }
      });

      for (const p of projects) {
        if (p.customer?.email) {
          let subject = "";
          let bodyHtml = "";
          if (days === 30) {
            subject = `How is your project doing, ${p.customer.name}?`;
            bodyHtml = `<p>Hi ${p.customer.name},</p><p>It's been a month since we successfully delivered <strong>${p.name}</strong>. We'd love to hear your feedback on how everything is running!</p>`;
          } else if (days === 60) {
            subject = `Ensure ${p.name} stays in top shape!`;
            bodyHtml = `<p>Hi ${p.customer.name},</p><p>To ensure <strong>${p.name}</strong> continues to run smoothly, we offer specialized maintenance packages. Let us know if you'd like to learn more.</p>`;
          } else if (days === 90) {
            subject = `Ready for the next step, ${p.customer.name}?`;
            bodyHtml = `<p>Hi ${p.customer.name},</p><p>It's been 3 months since we wrapped up <strong>${p.name}</strong>. If you're ready to add new features or start a new phase, we are here to help you scale.</p>`;
          }

          await sendEmail(
            p.customer.email,
            subject,
            generateTechnextEmailHtml("Post-Project Check-in", bodyHtml)
          );
          results.push(`Post-Project Drip (${days}d): ${p.name}`);
          console.log(`Sent Post-Project Drip to ${p.customer.email} for ${p.name} - Day ${days}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} reminders`,
      details: results
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
