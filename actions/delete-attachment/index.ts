"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { DeleteAttachment } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { id, boardId } = data;
  let attachment;

  try {
    attachment = await db.attachment.delete({
      where: { id },
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  after(() => {
    revalidatePath(`/board/${boardId}`);
  });
  return { data: attachment };
};

export const deleteAttachment = createSafeAction(DeleteAttachment, handler);
