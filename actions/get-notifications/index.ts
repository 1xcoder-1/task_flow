"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const PAGE_SIZE = 5;

export async function getNotifications(page: number = 1) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { notifications: [], totalCount: 0, totalPages: 0, unreadCount: 0 };
  }

  try {
    const skip = (page - 1) * PAGE_SIZE;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { assignedToId: userId },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip,
      }),
      db.notification.count({
        where: { assignedToId: userId },
      }),
      db.notification.count({
        where: { assignedToId: userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      unreadCount,
    };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { notifications: [], totalCount: 0, totalPages: 0, unreadCount: 0 };
  }
}

