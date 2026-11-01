export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AttendanceTrackerClient from "./AttendanceTrackerClient";

export default async function FacultyAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string; date?: string }>;
}) {
  const { batchId, date } = await searchParams;
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const batches = await prisma.facultyBatch.findMany({
    where: batchWhere,
    include: {
      course: true,
      students: {
        orderBy: { rollNo: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const targetDateStr = date || new Date().toISOString().split("T")[0];
  const targetDate = new Date(targetDateStr);

  const existingAttendances = await prisma.studentAttendance.findMany({
    where: {
      date: targetDate,
    },
  });

  return (
    <AttendanceTrackerClient
      batches={batches}
      initialBatchId={batchId || (batches[0]?.id || "")}
      initialDate={targetDateStr}
      existingAttendances={existingAttendances}
    />
  );
}
