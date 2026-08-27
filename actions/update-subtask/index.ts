"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { UpdateSubtask } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, isCompleted, boardId } = data;
  let subtask;

  try {
    subtask = await db.subtask.update({
      where: {
        id,
      },
      data: {
        isCompleted,
      },
    });
  } catch (error) {
    return {
      error: "Failed to update subtask.",
    };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: subtask };
};

export const updateSubtask = createSafeAction(UpdateSubtask, handler);
