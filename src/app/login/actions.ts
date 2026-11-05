"use server";

import { prisma } from "@/lib/prisma";
import { comparePassword, createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { error: "Invalid credentials." };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return { error: "Invalid credentials." };
  }

  if (user.isActive === false) {
    return { error: "Your staff account has been deactivated. Please contact Super Admin." };
  }

  // Create JWT session cookie with user email included
  await createSession(user.id, user.role, user.name, user.email);

  // Test account redirect directly into Billing Suite (no company details)
  if (user.email === "test@technext" || user.name?.toLowerCase() === "test") {
    redirect("/billing");
  }

  // Sales staff login directly into the Sales Portal Panel
  if (user.role === "SALES") {
    redirect("/sales");
  }

  // Super Admin & Admin redirect to Admin Panel
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
