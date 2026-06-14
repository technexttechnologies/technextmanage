"use server";

import { prisma } from "@/lib/prisma";
import { generateTechnextEmailHtml, sendEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function requestReset(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://technextmanage.vercel.app";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const bodyContent = `
      <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password. This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    const html = generateTechnextEmailHtml("Reset Your Password", bodyContent, {
      text: "Reset Password",
      url: resetLink,
    });

    await sendEmail(email, "Reset Your Password - TechNext CRM", html);

    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
