"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateAssignment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: currentUserId, orgId, sessionClaims } = await auth();

  if (!currentUserId || !orgId) {
    return { error: "Unauthorized" };
  }

  const claims = sessionClaims as { first_name?: string; last_name?: string; name?: string; image_url?: string; picture?: string } | null;
  const actorName = claims?.name || [claims?.first_name, claims?.last_name].filter(Boolean).join(" ") || "Someone";
  const actorImage = claims?.image_url || claims?.picture || "";

  const { userId, userName, userImage, cardId, boardId } = data;

  try {
    const existing = await db.cardAssignment.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (existing) {
      return { data: existing };
    }

    const assignment = await db.cardAssignment.create({
      data: {
        userId,
        userName,
        userImage,
        cardId,
      },
    });

    after(async () => {
      try {
        const card = await db.card.findUnique({
          where: { id: cardId },
          select: { title: true },
        });

        if (card) {
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

          await Promise.all([
            inngest.send({
              name: "app/notification.send",
              data: {
                notificationId: notification.id,
                taskTitle: card.title,
                assignedToName: userName,
                assignedById: currentUserId,
              },
            }).catch((error) => console.error("Failed to send notification event:", error)),
            inngest.send({
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
              },
            }).catch((error) => console.error("Failed to send audit log event:", error)),
          ]);
        }
      } catch (error) {
        console.error("Failed to send assignment side effects:", error);
      }

      revalidatePath("/board/" + boardId);
    });

    return { data: assignment };
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return { error: "Failed to create assignment." };
  }
};

export const createAssignment = createSafeAction(CreateAssignment, handler);
