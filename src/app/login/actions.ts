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

  // Create JWT session cookie
  await createSession(user.id, user.role, user.name);

  // Redirect to dashboard on success
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
