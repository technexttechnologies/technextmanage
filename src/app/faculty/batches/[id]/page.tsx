export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BatchDetailsClient from "./BatchDetailsClient";

export default async function BatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const batch = await prisma.facultyBatch.findUnique({
    where: { id },
    include: {
      course: true,
      faculty: true,
      students: {
        orderBy: { rollNo: "asc" },
      },
      attendances: {
        include: { student: true },
        orderBy: { date: "desc" },
        take: 30,
      },
      sessions: {
        orderBy: { sessionDate: "desc" },
      },
      assignments: {
        include: { submissions: true },
        orderBy: { createdAt: "desc" },
      },
      materials: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!batch) return notFound();

  return <BatchDetailsClient batch={batch} />;
}
