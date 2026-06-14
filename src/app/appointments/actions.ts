"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendCalendarInvite } from "@/lib/calendarSync";

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({
    where: { id }
  });
  revalidatePath("/appointments");
}

export async function updateAppointment(formData: FormData) {
  const id = formData.get("id") as string;
  const meetingPurpose = formData.get("meetingPurpose") as string;
  const dateStr = formData.get("date") as string;
  const time = formData.get("time") as string;
  const meetingType = formData.get("meetingType") as string;
  const meetLink = formData.get("meetLink") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  const date = new Date(dateStr);

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      meetingPurpose,
      date,
      time,
      meetingType,
      meetLink: meetLink || null,
      status,
      notes: notes || null
    },
    include: {
      customer: true
    }
  });

  // Re-send calendar invite if customer email exists
  if (appointment.customer?.email) {
    try {
      await sendCalendarInvite(appointment, appointment.customer.email, true);
    } catch (error) {
      console.error("Failed to send updated calendar invite", error);
    }
  }

  revalidatePath("/appointments");
  redirect("/appointments");
}
