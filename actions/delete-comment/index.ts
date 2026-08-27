"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteComment } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { id, boardId } = data;
  let comment;

  try {
    comment = await db.comment.delete({
      where: { id },
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};

export const deleteComment = createSafeAction(DeleteComment, handler);
