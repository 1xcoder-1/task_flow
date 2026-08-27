"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { DeleteAssignment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: currentUserId, orgId } = await auth();

  if (!currentUserId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { id, boardId } = data;
  let assignment;

  try {
    assignment = await db.cardAssignment.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    return { error: "Failed to delete assignment." };
  }

  revalidatePath("/board/" + boardId);
  return { data: assignment };
};

export const deleteAssignment = createSafeAction(DeleteAssignment, handler);
