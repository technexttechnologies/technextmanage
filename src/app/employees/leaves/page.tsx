export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LeaveManagementClient from "./LeaveManagementClient";

export const metadata = {
  title: "Employee Leave Management & Approvals - TechNext",
  description: "Company leave applications, status tracking, and HR review workflow.",
};

export default async function LeavesPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const isAdminOrHR = ["SUPER_ADMIN", "ADMIN", "HR", "HEAD"].includes(session.role as string);

  // If Admin or HR, see all company leaves; regular staff see their own leaves
  const leaves = await prisma.leaveRequest.findMany({
    where: isAdminOrHR ? {} : { userId: session.userId },
    include: {
      user: {
        include: {
          department: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <LeaveManagementClient
      leaves={leaves}
      currentUserId={session.userId}
      isAdminOrHR={isAdminOrHR}
    />
  );
}
