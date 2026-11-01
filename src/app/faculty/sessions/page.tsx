export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import SessionsClient from "./SessionsClient";

export default async function FacultySessionsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const [sessions, batches] = await Promise.all([
    prisma.facultySession.findMany({
      where: isAdmin ? {} : { facultyId: session?.userId as string },
      include: {
        batch: { include: { course: true } },
        faculty: true,
      },
      orderBy: { sessionDate: "desc" },
    }),
    prisma.facultyBatch.findMany({
      where: batchWhere,
      include: { course: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <SessionsClient sessions={sessions} batches={batches} />;
}
