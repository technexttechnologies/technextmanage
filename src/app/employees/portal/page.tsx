export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeePortalClient from "./EmployeePortalClient";

export const metadata = {
  title: "Employee Self-Service Portal - TechNext",
  description: "Personal staff portal for attendance, shifts, leave applications, and assigned projects.",
};

export default async function EmployeePortalPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [employee, todayAttendance, attendanceHistory, leaveHistory, assignedProjects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId as string },
      include: { department: true },
    }),
    prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId as string,
          date: today,
        },
      },
    }),
    prisma.attendance.findMany({
      where: { userId: session.userId as string },
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.leaveRequest.findMany({
      where: { userId: session.userId as string },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.project.findMany({
      where: { assignedToId: session.userId as string },
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  if (!employee) {
    redirect("/login");
  }

  return (
    <EmployeePortalClient
      employee={employee}
      todayAttendance={todayAttendance}
      attendanceHistory={attendanceHistory}
      leaveHistory={leaveHistory}
      assignedProjects={assignedProjects}
    />
  );
}
