"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { 
  sendWhatsAppNotification, 
  buildProjectUpdateMessage, 
  buildCustomerReviewMessage, 
  getWhatsAppLink,
  getAppUrl 
} from "@/lib/whatsapp";

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

async function notifyCustomer(project: any, eventType: string, customMessage: string = "") {
  const trackingLink = `${getAppUrl()}/track/${project.id}`;

  // 1. Email Notification
  if (project.customer?.email) {
    try {
      const { templates } = await import("@/lib/email-templates");
      let bodyContent = "";
      if (eventType === "CREATED") {
        bodyContent = templates.projectKickoff({ 
          name: project.name, 
          managerName: "TechNext Projects Team", 
          managerEmail: "info.technexttech@gmail.com" 
        });
      } else if (eventType === "DELIVERED") {
        bodyContent = templates.projectCompletion({ name: project.name });
      } else {
        bodyContent = templates.projectProgressUpdate({ 
          name: project.name, 
          progress: project.progress || 0, 
          completedTasks: [customMessage] 
        });
      }

      const html = generateTechnextEmailHtml(
        `Project Update: ${project.name}`,
        bodyContent,
        { text: "Track My Project", url: trackingLink }
      );

      await sendEmail(project.customer.email, `Technext Update: ${project.name}`, html);
    } catch (emailErr) {
      console.error("[Email Notification Error]", emailErr);
    }
  }

  // 2. Automated WhatsApp Notification
  if (project.customer?.phone) {
    try {
      const customerName = project.customer.name || "Valued Client";

      if (eventType === "DELIVERED") {
        const completionMsg = buildProjectUpdateMessage({
          customerName,
          projectName: project.name,
          status: project.status || "COMPLETED",
          progress: 100,
          trackingUrl: trackingLink,
          customNote: customMessage || "Your project deliverables have been finalized, tested, and deployed!"
        });

        await sendWhatsAppNotification({
          phone: project.customer.phone,
          recipientName: customerName,
          message: completionMsg,
          triggerType: "PROJECT_UPDATE",
          customerId: project.customer.id
        });

        // Trigger Google Review invitation
        const reviewMsg = buildCustomerReviewMessage({
          customerName,
          projectName: project.name
        });

        await sendWhatsAppNotification({
          phone: project.customer.phone,
          recipientName: customerName,
          message: reviewMsg,
          triggerType: "CUSTOMER_REVIEW",
          customerId: project.customer.id
        });
      } else {
        const updateMsg = buildProjectUpdateMessage({
          customerName,
          projectName: project.name,
          status: project.status || "PROJECT_RECEIVED",
          progress: project.progress || 0,
          trackingUrl: trackingLink,
          customNote: customMessage || undefined
        });

        await sendWhatsAppNotification({
          phone: project.customer.phone,
          recipientName: customerName,
          message: updateMsg,
          triggerType: "PROJECT_UPDATE",
          customerId: project.customer.id
        });
      }
    } catch (waErr) {
      console.error("[WhatsApp Notification Error]", waErr);
    }
  }
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

export async function updateProject(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const customerId = formData.get("customerId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  let startDate = new Date();
  if (startDateStr) startDate = new Date(startDateStr);
  let endDate = null;
  if (endDateStr) endDate = new Date(endDateStr);

  const licenseKey = formData.get("licenseKey") as string;
  const licenseType = formData.get("licenseType") as string;
  const softwareVersion = formData.get("softwareVersion") as string;
  const machineId = formData.get("machineId") as string;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description,
      type,
      startDate,
      endDate,
      customerId: customerId || null,
      licenseKey,
      licenseType,
      softwareVersion,
      machineId
    }
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({
    where: { id: projectId }
  });
  revalidatePath("/projects");
  redirect("/projects");
}

export async function addProjectHardware(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const itemName = formData.get("itemName") as string;
  const serialNo = formData.get("serialNo") as string;
  const warrantyEndStr = formData.get("warrantyEnd") as string;
  const notes = formData.get("notes") as string;

  await prisma.projectHardware.create({
    data: {
      projectId,
      itemName,
      serialNo,
      warrantyEnd: warrantyEndStr ? new Date(warrantyEndStr) : null,
      notes
    }
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectHardware(hardwareId: string, projectId: string) {
  await prisma.projectHardware.delete({
    where: { id: hardwareId }
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function dispatchProjectWhatsAppUpdate(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { customer: true }
  });

  if (!project || !project.customer?.phone) {
    throw new Error("Project or customer phone number not found.");
  }

  const customerName = project.customer.name || "Valued Client";
  const trackingLink = `${getAppUrl()}/track/${project.id}`;

  const message = buildProjectUpdateMessage({
    customerName,
    projectName: project.name,
    status: project.status || "IN_PROGRESS",
    progress: project.progress || 0,
    trackingUrl: trackingLink
  });

  const result = await sendWhatsAppNotification({
    phone: project.customer.phone,
    recipientName: customerName,
    message,
    triggerType: "PROJECT_UPDATE",
    customerId: project.customer.id,
    forceSend: true
  });

  const waLink = getWhatsAppLink(project.customer.phone, message);

  revalidatePath(`/projects/${projectId}`);
  return { success: true, result, waLink, message };
}

export async function dispatchProjectWhatsAppReview(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { customer: true }
  });

  if (!project || !project.customer?.phone) {
    throw new Error("Project or customer phone number not found.");
  }

  const customerName = project.customer.name || "Valued Client";
  const message = buildCustomerReviewMessage({
    customerName,
    projectName: project.name
  });

  const result = await sendWhatsAppNotification({
    phone: project.customer.phone,
    recipientName: customerName,
    message,
    triggerType: "CUSTOMER_REVIEW",
    customerId: project.customer.id,
    forceSend: true
  });

  const waLink = getWhatsAppLink(project.customer.phone, message);

  revalidatePath(`/projects/${projectId}`);
  return { success: true, result, waLink, message };
}
