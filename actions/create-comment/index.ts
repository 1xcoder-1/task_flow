"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";

import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    return { error: "Unauthorized" };
  }

  const { text, cardId, boardId } = data;
  let comment;

  try {
    const card = await db.card.findUnique({ where: { id: cardId } });

    comment = await db.comment.create({
      data: {
        text,
        cardId,
        userId: user.id,
        userImage: user.imageUrl,
        userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown User',
      },
    });

    if (card?.linkedCardId) {
      await db.comment.create({
        data: {
          text,
          cardId: card.linkedCardId,
          userId: user.id,
          userImage: user.imageUrl,
          userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown User',
        },
      });
    }
  } catch (error) {
    return { error: "Failed to create." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};

export const createComment = createSafeAction(CreateComment, handler);
