"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { CreateAttachment } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { url, type, title, cardId, boardId } = data;
  let attachment;

  try {
    const card = await db.card.findUnique({ where: { id: cardId } });

    attachment = await db.attachment.create({
      data: {
        url,
        type,
        title: title || "Attachment",
        cardId,
      },
    });

    if (card?.linkedCardId) {
      await db.attachment.create({
        data: {
          url,
          type,
          title: title || "Attachment",
          cardId: card.linkedCardId,
        },
      });
    }
  } catch (error) {
    return { error: "Failed to create." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: attachment };
};

export const createAttachment = createSafeAction(CreateAttachment, handler);
