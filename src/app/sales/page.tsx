export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SalesPortalClient from "./SalesPortalClient";

export const metadata = {
  title: "Sales Employee Portal - TechNext",
  description: "Sales executive workspace: request quotations, invoice clients, initiate projects, and provision services.",
};

export default async function SalesPortalPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HEAD"].includes(currentUser.role);

  // If Admin/Manager, view all pipeline requests; if Sales executive, focus on own deals
  const [customers, quotationRequests, invoiceRequests, projects, services] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        company: true,
        phone: true,
        email: true,
        gstNumber: true,
      },
    }),

    prisma.quotationRequest.findMany({
      where: isAdmin ? {} : { requestedById: session.userId },
      include: {
        customer: true,
        requestedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.invoiceRequest.findMany({
      where: isAdmin ? {} : { requestedById: session.userId },
      include: {
        customer: true,
        project: true,
        requestedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.project.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { salesRepId: session.userId },
              { assignedToId: session.userId },
            ],
          },
      include: {
        customer: true,
        salesRep: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.servicePackage.findMany({
      where: isAdmin ? {} : { salesRepId: session.userId },
      include: {
        customer: true,
        salesRep: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <SalesPortalClient
      currentUser={currentUser}
      customers={customers}
      quotationRequests={quotationRequests}
      invoiceRequests={invoiceRequests}
      projects={projects}
      services={services}
      isAdmin={isAdmin}
    />
  );
}
