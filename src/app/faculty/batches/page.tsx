export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import BatchesClient from "./BatchesClient";

export default async function FacultyBatchesPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const [batches, courses, faculties] = await Promise.all([
    prisma.facultyBatch.findMany({
      where: batchWhere,
      include: {
        course: true,
        faculty: true,
        _count: {
          select: { students: true, assignments: true, sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["FACULTY", "ADMIN", "SUPER_ADMIN", "HEAD"] },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <BatchesClient 
      batches={batches}
      courses={courses}
      faculties={faculties}
    />
  );
}
