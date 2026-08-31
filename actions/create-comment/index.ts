"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";

import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { text, cardId, boardId, mentionedUserIds } = data;
  let comment;
  let linkedComment;

  try {
    const user = await currentUser();
    const actorName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User";
    const actorImage = user?.imageUrl || null;

    const card = await db.card.findUnique({ where: { id: cardId } });

    comment = await db.comment.create({
      data: {
        text,
        cardId,
        userId,
        userImage: actorImage || "",
        userName: actorName,
      },
    });

    if (card?.linkedCardId) {
      linkedComment = await db.comment.create({
        data: {
          text,
          cardId: card.linkedCardId,
          userId,
          userImage: actorImage || "",
          userName: actorName,
        },
      });
    }

    // Trigger user detail enrichment
    await inngest.send({
      name: "app/comment.update_user",
      data: {
        commentIds: [comment.id, linkedComment?.id].filter(Boolean) as string[],
        userId,
      }
    });

    // Handle @mentions: Create notifications for mentioned users
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      const truncatedCardTitle = card?.title ? (card.title.length > 20 ? card.title.slice(0, 20) + "…" : card.title) : "task";
      
      const notificationPromises = mentionedUserIds
        .filter((targetUserId) => targetUserId !== userId)
        .map((targetUserId) =>
          db.notification.create({
            data: {
              taskId: cardId,
              assignedById: userId,
              assignedToId: targetUserId,
              channel: "in-app",
              status: "sent",
              title: "Mentioned in Comment",
              message: `mentioned you in a comment on "${truncatedCardTitle}"`,
              actorName,
              actorImage,
              linkUrl: `/board/${boardId}?cardId=${cardId}`,
            },
          })
        );

      await Promise.all(notificationPromises);
    }
  } catch (error) {
    console.error("Create comment error:", error);
    return { error: "Failed to create." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};

export const createComment = createSafeAction(CreateComment, handler);
