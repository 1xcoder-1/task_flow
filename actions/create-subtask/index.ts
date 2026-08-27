"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { CreateSubtask } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, cardId, boardId } = data;
  let subtask;

  try {
    subtask = await db.subtask.create({
      data: {
        title,
        cardId,
      },
    });
  } catch (error) {
    return {
      error: "Failed to create subtask.",
    };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: subtask };
};

export const createSubtask = createSafeAction(CreateSubtask, handler);
