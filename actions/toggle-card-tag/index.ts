"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ToggleCardTag } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { cardId, tagId, boardId } = data;
  let attached = false;

  try {
    const existing = await (db as any).cardTag.findUnique({
      where: {
        cardId_tagId: {
          cardId,
          tagId,
        },
      },
    });

    if (existing) {
      await (db as any).cardTag.delete({
        where: { id: existing.id },
      });
      attached = false;
    } else {
      await (db as any).cardTag.create({
        data: {
          cardId,
          tagId,
        },
      });
      attached = true;
    }
  } catch (error) {
    return { error: "Failed to update tag." };
  }

  after(() => {
    revalidatePath(`/board/${boardId}`);
  });
  return { data: { cardId, tagId, attached } };
};

export const toggleCardTag = createSafeAction(ToggleCardTag, handler);
