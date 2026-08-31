"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function markNotificationRead(notificationId: string, path: string) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  try {
    await db.notification.update({
      where: {
        id: notificationId,
        assignedToId: userId, // Ensure user can only mark their own notifications
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification read:", error);
    return { error: "Failed to mark as read" };
  }
}

export async function markAllNotificationsRead(path: string) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  try {
    await db.notification.updateMany({
      where: {
        assignedToId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications read:", error);
    return { error: "Failed to mark all as read" };
  }
}
