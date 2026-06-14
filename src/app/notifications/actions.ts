"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getUnreadNotifications() {
  const session = await getSession();
  if (!session) return [];

  return await prisma.inAppNotification.findMany({
    where: {
      userId: session.userId as string,
      isRead: false
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
}

export async function markAsRead(notificationId: string) {
  const session = await getSession();
  if (!session) return;

  await prisma.inAppNotification.updateMany({
    where: {
      id: notificationId,
      userId: session.userId as string
    },
    data: {
      isRead: true
    }
  });
}

export async function markAllAsRead() {
  const session = await getSession();
  if (!session) return;

  await prisma.inAppNotification.updateMany({
    where: {
      userId: session.userId as string,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}
