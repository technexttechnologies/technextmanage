"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function clockIn() {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId as string,
        date: today
      }
    }
  });

  if (existing) {
    throw new Error("Already clocked in today");
  }

  await prisma.attendance.create({
    data: {
      userId: session.userId as string,
      date: today,
      clockIn: new Date(),
      status: "PRESENT"
    }
  });

  revalidatePath("/hr/attendance");
}

export async function clockOut() {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId as string,
        date: today
      }
    }
  });

  if (!existing) {
    throw new Error("Not clocked in today");
  }

  if (existing.clockOut) {
    throw new Error("Already clocked out");
  }

  await prisma.attendance.update({
    where: { id: existing.id },
    data: { clockOut: new Date() }
  });

  revalidatePath("/hr/attendance");
}
