export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffAttendanceClient from "./StaffAttendanceClient";

export const metadata = {
  title: "Staff Attendance & Shift Records - TechNext",
  description: "Company-wide employee attendance roster, live clock-in history, and working hours.",
};

export default async function StaffAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const { date } = await searchParams;
  const targetDateStr = date || new Date().toISOString().split("T")[0];
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const isAdminOrHR = ["SUPER_ADMIN", "ADMIN", "HR", "HEAD"].includes(session.role as string);

  if (!isAdminOrHR) {
    redirect("/employees/portal");
  }

  const [employees, attendances, departments] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: { date: targetDate },
      include: { user: true },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <StaffAttendanceClient
      employees={employees}
      attendances={attendances}
      selectedDateStr={targetDateStr}
      departments={departments}
      isAdminOrHR={isAdminOrHR}
    />
  );
}
