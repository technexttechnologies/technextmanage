"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";

export async function createAMC(formData: FormData) {
  const title = formData.get("title") as string;
  const customerId = formData.get("customerId") as string;
  const projectId = formData.get("projectId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as string || "ACTIVE";
  const amcType = formData.get("amcType") as string || "GENERAL";

  await prisma.aMC.create({
    data: {
      title,
      customerId,
      projectId: projectId || null,
      amount,
      startDate,
      endDate,
      status,
      amcType,
      notes: notes || null,
    },
  });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (customer?.email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "AMC Created" } });
    const emailSubject = template?.subject || "Annual Maintenance Contract (AMC) Created";
    let emailBody = template?.body || `
      <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">AMC Confirmation</h2>
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">We are pleased to confirm that your Annual Maintenance Contract (AMC) for <strong>"{{title}}"</strong> has been successfully generated and activated.</p>
      
      <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">Start Date</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">{{start_date}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">End Date</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">{{end_date}}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">Our team is committed to providing you with dedicated support and maintenance throughout this period. If you have any immediate concerns, please do not hesitate to reach out.</p>
      <p style="font-size: 16px; color: #334155; margin-top: 30px;">Best regards,<br/><strong>technext</strong></p>
    `;
    
    emailBody = emailBody.replace(/\{\{title\}\}/g, title)
                         .replace(/\{\{start_date\}\}/g, startDate.toDateString())
                         .replace(/\{\{end_date\}\}/g, endDate.toDateString())
                         .replace(/\n/g, '<br/>');

    await sendEmail(customer.email, emailSubject, generateTechnextEmailHtml(emailSubject, emailBody));
  }

  revalidatePath("/amc");
  revalidatePath(`/customers/${customerId}`);
  redirect("/amc");
}

export async function updateAMCStatus(id: string, status: string) {
  const amc = await prisma.aMC.update({
    where: { id },
    data: { status },
    include: { customer: true }
  });

  if (amc.customer?.email) {
    const template = await prisma.messageTemplate.findFirst({ where: { name: "AMC Status Update" } });
    const emailSubject = template?.subject || `Update on your AMC: ${amc.title}`;
    let emailBody = template?.body || `
      <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">AMC Status Update</h2>
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">This is an automated notification regarding your Annual Maintenance Contract (AMC) for <strong>"{{title}}"</strong>.</p>
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">The status of your AMC has been updated to: <span style="display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px;">{{status}}</span></p>
      <p style="font-size: 16px; color: #334155; margin-top: 30px;">Best regards,<br/><strong>technext</strong></p>
    `;
    
    emailBody = emailBody.replace(/\{\{title\}\}/g, amc.title)
                         .replace(/\{\{status\}\}/g, status.replace(/_/g, " "))
                         .replace(/\n/g, '<br/>');

    await sendEmail(amc.customer.email, emailSubject, generateTechnextEmailHtml(emailSubject, emailBody));
  }

  revalidatePath("/amc");
  revalidatePath(`/customers/${amc.customerId}`);
}

export async function deleteAMC(id: string) {
  const amc = await prisma.aMC.findUnique({ where: { id } });
  if (amc) {
    await prisma.aMC.delete({
      where: { id },
    });
    revalidatePath("/amc");
    revalidatePath(`/customers/${amc.customerId}`);
  }
}
