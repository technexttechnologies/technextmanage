export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import StudentsClient from "./StudentsClient";

export default async function FacultyStudentsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const [students, batches] = await Promise.all([
    prisma.student.findMany({
      where: isAdmin ? {} : { batch: batchWhere },
      include: {
        batch: {
          include: { course: true },
        },
      },
      orderBy: { rollNo: "asc" },
    }),
    prisma.facultyBatch.findMany({
      where: batchWhere,
      include: { course: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <StudentsClient students={students} batches={batches} />;
}
