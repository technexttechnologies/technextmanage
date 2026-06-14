"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";

export async function createCustomer(formData: FormData) {
  // Hardcode assignment for now until auth is added
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: "admin@technext.com",
        name: "Admin User",
        passwordHash: "dummy",
        role: "SUPER_ADMIN"
      }
    });
  }

  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const status = formData.get("status") as string || "LEAD";
  const address = formData.get("address") as string;
  const gstNumber = formData.get("gstNumber") as string;
  const notes = formData.get("notes") as string;

  const customer = await prisma.customer.create({
    data: {
      name,
      company,
      phone,
      email,
      status,
      address,
      gstNumber,
      notes,
      assignedToId: adminUser.id,
    }
  });

  if (email) {
    try {
      const emailBody = `
        <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Welcome to Technext Technologies, ${name}!</h2>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">We are thrilled to connect with you.</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">At Technext Technologies, we specialize in delivering cutting-edge software, IT solutions, and digital growth strategies tailored to your needs. Our team is dedicated to providing you with the highest quality of service and support.</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">If you have any questions, require technical assistance, or wish to explore our services further, please do not hesitate to reach out to us.</p>
        <p style="font-size: 16px; color: #334155; margin-top: 24px;">Best regards,<br/><strong>technext</strong></p>
      `;
      
      const html = generateTechnextEmailHtml(
        "Welcome to Technext",
        emailBody,
        { text: "Visit Our Website", url: "https://technexttechnologies.com" }
      );

      await sendEmail(email, "Welcome to Technext Technologies", html);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Non-blocking error.
    }
  }

  let redirectUrl = "/customers";
  if (phone) {
    redirectUrl += `?wa_welcome=1&wa_phone=${encodeURIComponent(phone)}&wa_name=${encodeURIComponent(name)}`;
  }
  
  redirect(redirectUrl);
}
