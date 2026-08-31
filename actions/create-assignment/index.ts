"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateAssignment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: currentUserId, orgId } = await auth();

  if (!currentUserId || !orgId) {
    return { error: "Unauthorized" };
  }

  const user = await currentUser();
  const actorName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Someone";
  const actorImage = user?.imageUrl || "";

  const { userId, userName, userImage, cardId, boardId } = data;
  let assignment;

  try {
    // Check if already assigned
    const existing = await db.cardAssignment.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        }
      }
    });

    if (existing) {
      return { data: existing };
    }

    assignment = await db.cardAssignment.create({
      data: {
        userId,
        userName,
        userImage,
        cardId,
      },
    });

    const card = await db.card.findUnique({
      where: { id: cardId },
    });

    if (card) {
      // 1. Create in-app notification for the assigned user
      const notification = await db.notification.create({
        data: {
          taskId: cardId,
          assignedById: currentUserId,
          assignedToId: userId,
          channel: "discord",
          status: "pending",
          title: "New Assignment",
          message: `assigned "${card.title.length > 20 ? card.title.slice(0, 20) + "…" : card.title}" to you`,
          actorName,
          actorImage,
          linkUrl: `/board/${boardId}`,
        },
      });

      // 2. Fire notification event (Discord + DB status update)
      try {
        await inngest.send({
          name: "app/notification.send",
          data: {
            notificationId: notification.id,
            taskTitle: card.title,
            assignedToName: userName,
            assignedById: currentUserId,
          }
        });
      } catch (e) {
        console.error("Failed to send notification inngest event:", e);
      }

      // 3. Fire audit log event so assignment appears in Activity Log
      try {
        await inngest.send({
          name: "app/audit.log",
          data: {
            orgId,
            entityId: cardId,
            entityType: "CARD",
            entityTitle: `${userName} to "${card.title}"`,
            action: "CREATE",
            userId: currentUserId,
            userImage: actorImage,
            userName: actorName,
          }
        });
      } catch (e) {
        console.error("Failed to send audit log inngest event:", e);
      }
    }
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return { error: "Failed to create assignment." };
  }

  revalidatePath("/board/" + boardId);
  return { data: assignment };
};

export const createAssignment = createSafeAction(CreateAssignment, handler);
