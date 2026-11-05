export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession, isTestSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeesClient from "./EmployeesClient";

export const metadata = {
  title: "Employee Directory & Management - TechNext Operations",
  description: "Enterprise employee directory, department allocations, shift hours, and HR profiles.",
};

export default async function EmployeesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (isTestSession(session)) {
    redirect("/billing");
  }

  // Only Admin, HR, Super Admin can view full management
  const isAdminOrHR = ["SUPER_ADMIN", "ADMIN", "HR", "HEAD"].includes(session.role as string);
  if (!isAdminOrHR) {
    redirect("/employees/portal");
  }

  const [employees, departments] = await Promise.all([
    prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <EmployeesClient 
      employees={employees as any}
      departments={departments}
      currentUserId={session.userId as string}
    />
  );
}
