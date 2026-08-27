"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateAssignment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: currentUserId, orgId } = await auth();

  if (!currentUserId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { userId, userName, userImage, cardId, boardId } = data;
  let assignment;

  try {
    assignment = await db.cardAssignment.create({
      data: {
        userId,
        userName,
        userImage,
        cardId,
      },
    });
  } catch (error) {
    return { error: "Failed to create assignment." };
  }

  revalidatePath("/board/" + boardId);
  return { data: assignment };
};

export const createAssignment = createSafeAction(CreateAssignment, handler);
