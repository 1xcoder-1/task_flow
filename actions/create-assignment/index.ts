"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
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

  const { userId, userName, userImage, cardId, boardId } = data;
  let assignment;

  try {
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
      const notification = await db.notification.create({
        data: {
          taskId: cardId,
          assignedById: currentUserId,
          assignedToId: userId,
          channel: "discord",
          status: "pending",
        },
      });

      await inngest.send({
        name: "app/notification.send",
        data: {
          notificationId: notification.id,
          taskTitle: card.title,
          assignedToName: userName,
          assignedById: currentUserId,
        }
      });
    }
  } catch (error) {
    return { error: "Failed to create assignment." };
  }

  revalidatePath("/board/" + boardId);
  return { data: assignment };
};

export const createAssignment = createSafeAction(CreateAssignment, handler);
