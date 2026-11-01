export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export const metadata = {
  title: "User Management - TechNext Operations",
  description: "Manage system users, faculty, roles, and access permissions.",
};

export default async function UsersPage() {
  const session = await getSession();

  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
    redirect("/");
  }

  const [users, departments] = await Promise.all([
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
    <UserManagementClient 
      users={users as any}
      departments={departments}
      currentUserId={session.userId as string}
    />
  );
}
