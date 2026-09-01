"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { ReorderSubtasks } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { cardId, items } = data;
  let updatedSubtasks;

  try {
    const transaction = items.map((subtask) =>
      db.subtask.update({
        where: {
          id: subtask.id,
          cardId,
        },
        data: {
          title: subtask.title,
          isCompleted: subtask.isCompleted,
        },
      })
    );

    updatedSubtasks = await db.$transaction(transaction);

    const card = await db.card.findUnique({
      where: { id: cardId },
      select: { list: { select: { boardId: true } } },
    });

    if (card) {
      revalidatePath(`/board/${card.list.boardId}`);
    }
  } catch (error) {
    console.error("Reorder subtasks error:", error);
    return {
      error: "Failed to reorder subtasks.",
    };
  }

  return { data: updatedSubtasks };
};

export const reorderSubtasks = createSafeAction(ReorderSubtasks, handler);
