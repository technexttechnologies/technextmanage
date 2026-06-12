"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

async function notifyCustomer(project: any, eventType: string, customMessage: string = "") {
  if (!project.customer?.email) return;

  const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/track/${project.id}`;
  
  const bodyContent = `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Hello ${project.customer.name},</h2>
    <p style="font-size: 16px;">${customMessage}</p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Current Status</h3>
      <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #2563eb;">${formatStatus(project.status)}</p>
      
      <div style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; font-weight: 600; color: #475569;">
          <span>Progress</span>
          <span>${project.progress}%</span>
        </div>
        <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%); width: ${project.progress}%; height: 100%; border-radius: 4px;"></div>
        </div>
      </div>
    </div>
  `;

  const html = generateTechnextEmailHtml(
    `Project Update: ${project.name}`,
    bodyContent,
    { text: "Track My Project", url: trackingLink }
  );

  await sendEmail(project.customer.email, `Technext Update: ${project.name}`, html);
}

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const status = formData.get("status") as string || "PROJECT_RECEIVED";
  const customerId = formData.get("customerId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  let startDate = new Date();
  if (startDateStr) startDate = new Date(startDateStr);
  let endDate = null;
  if (endDateStr) endDate = new Date(endDateStr);

  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) throw new Error("No admin user found");

  const project = await prisma.project.create({
    data: {
      name,
      description,
      type,
      status,
      progress: status === "PROJECT_RECEIVED" ? 5 : 0,
      startDate,
      endDate,
      assignedToId: adminUser.id,
      ...(customerId ? { customerId } : {})
    },
    include: { customer: true }
  });

  await prisma.activityLog.create({
    data: {
      action: "Project created",
      entityType: "PROJECT",
      entityId: project.id,
      userId: adminUser.id
    }
  });

  await notifyCustomer(project, "CREATED", `We have officially received your project "${project.name}" and are preparing to begin.`);

  redirect("/projects");
}

export async function updateProjectStatus(projectId: string, status: string, progress: number) {
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status, progress },
    include: { customer: true }
  });

  await prisma.activityLog.create({
    data: {
      action: `Status changed to ${formatStatus(status)} (${progress}%)`,
      entityType: "PROJECT",
      entityId: project.id,
      userId: adminUser?.id || ""
    }
  });

  if (status === "COMPLETED" || status === "DEPLOYMENT") {
    await notifyCustomer(project, "DELIVERED", `Great news! Your project has reached the ${formatStatus(status)} stage.`);
  } else {
    await notifyCustomer(project, "UPDATED", `Your project status has been updated to ${formatStatus(status)}.`);
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectNote(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const content = formData.get("content") as string;
  
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

  await prisma.projectNote.create({
    data: {
      projectId,
      content,
      userId: adminUser?.id || ""
    }
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function togglePinNote(noteId: string, isPinned: boolean, projectId: string) {
  await prisma.projectNote.update({
    where: { id: noteId },
    data: { isPinned }
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectNote(noteId: string, projectId: string) {
  await prisma.projectNote.delete({
    where: { id: noteId }
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function createMilestone(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const dueDateStr = formData.get("dueDate") as string;

  await prisma.projectMilestone.create({
    data: {
      projectId,
      title,
      dueDate: dueDateStr ? new Date(dueDateStr) : null
    }
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function completeMilestone(milestoneId: string, projectId: string) {
  const milestone = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: { 
      isCompleted: true, 
      completedAt: new Date() 
    }
  });

  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  
  await prisma.activityLog.create({
    data: {
      action: `Completed milestone: ${milestone.title}`,
      entityType: "PROJECT",
      entityId: projectId,
      userId: adminUser?.id || ""
    }
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { customer: true }
  });

  if (project) {
    await notifyCustomer(project, "MILESTONE", `We have successfully completed a major milestone: ${milestone.title}.`);
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectWarranty(projectId: string, formData: FormData) {
  const warrantyEndDateStr = formData.get("warrantyEndDate") as string;
  const freeUpdatesEndDateStr = formData.get("freeUpdatesEndDate") as string;
  const amcId = formData.get("amcId") as string;
  
  let warrantyEndDate = null;
  if (warrantyEndDateStr) warrantyEndDate = new Date(warrantyEndDateStr);
  
  let freeUpdatesEndDate = null;
  if (freeUpdatesEndDateStr) freeUpdatesEndDate = new Date(freeUpdatesEndDateStr);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      warrantyEndDate,
      freeUpdatesEndDate,
      amcId: amcId || null,
    }
  });

  revalidatePath(`/projects/${projectId}`);
}
