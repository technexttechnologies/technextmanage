"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function resetPassword(token: string, prevState: any, formData: FormData) {
  if (!token) {
    return { error: "Invalid token" };
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Please fill in all fields" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { error: "Invalid or expired reset token" };
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return { error: "Reset token has expired" };
    }

    const hashedPassword = await hashPassword(password);

    // Update user password and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
