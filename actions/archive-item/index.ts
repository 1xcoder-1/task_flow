"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ArchiveItem } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { type, id, boardId } = data;

  try {
    let result;

    if (type === "CARD") {
      result = await (db.card as any).update({
        where: { id },
        data: { isArchived: true, deletedAt: new Date() },
      });
      if (boardId) revalidatePath(`/board/${boardId}`);
    } else if (type === "LIST") {
      result = await (db.list as any).update({
        where: { id },
        data: {
          isArchived: true,
          deletedAt: new Date(),
          cards: {
            updateMany: {
              where: {},
              data: { isArchived: true, deletedAt: new Date() },
            },
          },
        },
      });
      if (boardId) revalidatePath(`/board/${boardId}`);
    } else if (type === "BOARD") {
      result = await (db.board as any).update({
        where: { id, orgId },
        data: { isArchived: true, deletedAt: new Date() },
      });
      revalidatePath(`/organization/${orgId}`);
    } else if (type === "FOLDER") {
      result = await (db.folder as any).update({
        where: { id, orgId },
        data: { isArchived: true, deletedAt: new Date() },
      });
      revalidatePath(`/organization/${orgId}`);
    }

    revalidatePath(`/organization/${orgId}`);
    return { data: result };
  } catch (error) {
    console.error("Failed to archive item:", error);
    return { error: "Failed to archive item." };
  }
};

export const archiveItem = createSafeAction(ArchiveItem, handler);
