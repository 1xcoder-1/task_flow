"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import type { Comment } from "@prisma/client";

import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId, sessionClaims } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { text, cardId, boardId, mentionedUserIds } = data;
  let comment: Comment;
  let linkedComment: Comment | undefined;

  try {
    const claims = sessionClaims as { first_name?: string; last_name?: string; name?: string; image_url?: string; picture?: string } | null;
    let actorName = claims?.name || [claims?.first_name, claims?.last_name].filter(Boolean).join(" ");
    let actorImage = claims?.image_url || claims?.picture || null;

    if (!actorName) {
      const user = await currentUser();
      actorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || user?.primaryEmailAddress?.emailAddress || "User";
      actorImage = actorImage || user?.imageUrl || null;
    }

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

    after(() => inngest.send({
      name: "app/comment.update_user",
      data: {
        commentIds: [comment.id, linkedComment?.id].filter(Boolean) as string[],
        userId,
      },
    }).catch((error) => console.error("Comment user enrichment failed:", error)));

    // Handle @mentions: Create notifications for mentioned users
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      const truncatedCardTitle = card?.title ? (card.title.length > 20 ? card.title.slice(0, 20) + "…" : card.title) : "task";
      
      const notificationPromises = mentionedUserIds.flatMap((targetUserId) => {
        if (targetUserId === userId) return [];
        return [
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
          }),
        ];
      });

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
