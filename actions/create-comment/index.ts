"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
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

  const { text, cardId, boardId } = data;
  let comment;
  let linkedComment;

  try {
    const card = await db.card.findUnique({ where: { id: cardId } });

    comment = await db.comment.create({
      data: {
        text,
        cardId,
        userId,
        userImage: "",
        userName: "Unknown User",
      },
    });

    if (card?.linkedCardId) {
      linkedComment = await db.comment.create({
        data: {
          text,
          cardId: card.linkedCardId,
          userId,
          userImage: "",
          userName: "Unknown User",
        },
      });
    }

    await inngest.send({
      name: "app/comment.update_user",
      data: {
        commentIds: [comment.id, linkedComment?.id].filter(Boolean) as string[],
        userId,
      }
    });
  } catch (error) {
    return { error: "Failed to create." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};

export const createComment = createSafeAction(CreateComment, handler);
