export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WhatsAppSettingsClient } from "./WhatsAppSettingsClient";

export const metadata = {
  title: "WhatsApp Message Automation | TechNext CRM",
  description: "Configure automated WhatsApp messaging for project updates, service requests, customer reviews, and customer portal links.",
};

export default async function WhatsAppSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Allow Super Admin and Admin to access configuration
  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) {
    redirect("/sales");
  }

  const [settings, logs] = await Promise.all([
    prisma.systemSettings.findFirst(),
    prisma.whatsAppLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { customer: true },
    }),
  ]);

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "SENT").length,
    simulated: logs.filter((l) => l.status === "SIMULATED").length,
    failed: logs.filter((l) => l.status === "FAILED").length,
  };

  return (
    <WhatsAppSettingsClient 
      settings={settings} 
      logs={logs} 
      stats={stats} 
    />
  );
}
