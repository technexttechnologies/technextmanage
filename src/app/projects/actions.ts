"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mailer";

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

async function notifyCustomer(project: any, eventType: string, customMessage: string = "") {
  if (!project.customer?.email) return;

  const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/track/${project.id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <h2 style="color: #0A2540;">Project Update: ${project.name}</h2>
      <p>Dear ${project.customer.name},</p>
      <p>${customMessage}</p>
      <div style="background-color: #F7F9FC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #0A2540;">Current Status: ${formatStatus(project.status)}</h3>
        <p style="margin: 0;"><strong>Progress:</strong> ${project.progress}%</p>
      </div>
      <p>You can track the live progress of your project anytime securely using your unique tracking link:</p>
      <a href="${trackingLink}" style="display: inline-block; background-color: #635BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Track My Project</a>
      <p style="margin-top: 32px; font-size: 14px; color: #6B7280;">Best regards,<br>TechNext Technologies</p>
    </div>
  `;

  await sendEmail(project.customer.email, `TechNext Update: ${project.name}`, html);
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
