export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import MaterialsClient from "./MaterialsClient";

export default async function FacultyMaterialsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const batchWhere = isAdmin 
    ? {} 
    : { OR: [{ facultyId: session?.userId as string }, { facultyId: null }] };

  const [materials, batches] = await Promise.all([
    prisma.facultyMaterial.findMany({
      where: isAdmin ? {} : { facultyId: session?.userId as string },
      include: {
        batch: { include: { course: true } },
        faculty: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facultyBatch.findMany({
      where: batchWhere,
      include: { course: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <MaterialsClient materials={materials} batches={batches} />;
}
