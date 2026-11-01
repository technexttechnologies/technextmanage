export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AssignmentsClient from "./AssignmentsClient";

export default async function FacultyAssignmentsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const [assignments, batches] = await Promise.all([
    prisma.facultyAssignment.findMany({
      where: isAdmin ? {} : { facultyId: session?.userId as string },
      include: {
        batch: { include: { course: true } },
        submissions: {
          include: { student: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facultyBatch.findMany({
      where: batchWhere,
      include: { course: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <AssignmentsClient assignments={assignments} batches={batches} />;
}
