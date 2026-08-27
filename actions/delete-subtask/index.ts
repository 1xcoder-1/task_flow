"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteSubtask } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { id, boardId } = data;
  let subtask;

  try {
    subtask = await db.subtask.delete({
      where: { id },
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: subtask };
};

export const deleteSubtask = createSafeAction(DeleteSubtask, handler);
