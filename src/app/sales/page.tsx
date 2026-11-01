export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SalesPortalClient from "./SalesPortalClient";

export const metadata = {
  title: "Sales Employee Portal - TechNext",
  description: "Sales executive workspace: manage client deals, request quotations, invoices, projects, and services.",
};

function maskPhone(phone?: string | null): string {
  if (!phone) return "—";
  const clean = phone.trim();
  if (clean.length <= 4) return "****";
  const last4 = clean.slice(-4);
  const first3 = clean.slice(0, 3);
  return `${first3}*** ***${last4}`;
}

function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const name = parts[0];
  const domain = parts[1];
  const firstLetter = name.charAt(0);
  return `${firstLetter}***@${domain}`;
}

export default async function SalesPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const validTabs = ["overview", "quotations", "invoices", "projects", "services", "clients", "access-requests"];
  const initialTab = (resolvedParams?.tab && validTabs.includes(resolvedParams.tab))
    ? (resolvedParams.tab as any)
    : "overview";

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HEAD"].includes(currentUser.role);

  // Fetch all data with role-based client access filtering
  const [allCustomers, quotationRequests, invoiceRequests, projects, services, accessRequests] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        assignedTo: {
          select: { id: true, name: true },
        },
        accessRequests: {
          where: isAdmin ? {} : { requestedById: session.userId },
        },
        quotationRequests: {
          where: { requestedById: session.userId },
          select: { id: true },
        },
        invoiceRequests: {
          where: { requestedById: session.userId },
          select: { id: true },
        },
        projects: {
          where: { salesRepId: session.userId },
          select: { id: true },
        },
        packages: {
          where: { salesRepId: session.userId },
          select: { id: true },
        },
      },
    }),

    // Quotation requests (own if sales, all if admin)
    prisma.quotationRequest.findMany({
      where: isAdmin ? {} : { requestedById: session.userId },
      include: {
        customer: true,
        requestedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Invoice requests (own if sales, all if admin)
    prisma.invoiceRequest.findMany({
      where: isAdmin ? {} : { requestedById: session.userId },
      include: {
        customer: true,
        project: true,
        requestedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Projects initiated/assigned to user
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

    // Services provisioned by user
    prisma.servicePackage.findMany({
      where: isAdmin ? {} : { salesRepId: session.userId },
      include: {
        customer: true,
        salesRep: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Client Access Requests
    prisma.clientAccessRequest.findMany({
      where: isAdmin ? {} : { requestedById: session.userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            phone: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Compute client access status and mask another client's details if unapproved
  const customers = allCustomers.map((c) => {
    const isAssigned = c.assignedToId === session.userId;
    const hasDeals = 
      c.quotationRequests.length > 0 ||
      c.invoiceRequests.length > 0 ||
      c.projects.length > 0 ||
      c.packages.length > 0;
    
    const approvedRequest = c.accessRequests.find(r => r.requestedById === session.userId && r.status === "APPROVED");
    const pendingRequest = c.accessRequests.find(r => r.requestedById === session.userId && r.status === "PENDING");
    const rejectedRequest = c.accessRequests.find(r => r.requestedById === session.userId && r.status === "REJECTED");

    const hasFullAccess = isAdmin || isAssigned || hasDeals || !!approvedRequest;

    return {
      id: c.id,
      name: c.name,
      company: c.company,
      hasAccess: hasFullAccess,
      accessStatus: approvedRequest ? "APPROVED" : pendingRequest ? "PENDING" : rejectedRequest ? "REJECTED" : "UNREQUESTED",
      accessRequestId: pendingRequest?.id || rejectedRequest?.id || approvedRequest?.id || null,
      adminRemarks: rejectedRequest?.adminRemarks || approvedRequest?.adminRemarks || null,
      assignedToName: c.assignedTo?.name || "General Pool",
      phone: hasFullAccess ? c.phone : maskPhone(c.phone),
      email: hasFullAccess ? c.email : maskEmail(c.email),
      gstNumber: hasFullAccess ? c.gstNumber : (c.gstNumber ? "🔒 Restricted" : null),
      address: hasFullAccess ? c.address : "🔒 Restricted Location",
    };
  });

  return (
    <SalesPortalClient
      currentUser={currentUser}
      customers={customers}
      accessRequests={accessRequests}
      quotationRequests={quotationRequests}
      invoiceRequests={invoiceRequests}
      projects={projects}
      services={services}
      isAdmin={isAdmin}
      initialTab={initialTab}
    />
  );
}
