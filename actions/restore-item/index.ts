"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { RestoreItem } from "./schema";
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
        data: { isArchived: false, deletedAt: null },
      });
      if (boardId) revalidatePath(`/board/${boardId}`);
    } else if (type === "LIST") {
      result = await (db.list as any).update({
        where: { id },
        data: {
          isArchived: false,
          deletedAt: null,
          cards: {
            updateMany: {
              where: {},
              data: { isArchived: false, deletedAt: null },
            },
          },
        },
      });
      if (boardId) revalidatePath(`/board/${boardId}`);
    } else if (type === "BOARD") {
      result = await (db.board as any).update({
        where: { id, orgId },
        data: { isArchived: false, deletedAt: null },
      });
      revalidatePath(`/organization/${orgId}`);
    } else if (type === "FOLDER") {
      result = await (db.folder as any).update({
        where: { id, orgId },
        data: { isArchived: false, deletedAt: null },
      });
      revalidatePath(`/organization/${orgId}`);
    } else if (type === "YEAR_FOLDER") {
      result = await (db.yearFolder as any).update({
        where: { id },
        data: { isArchived: false, deletedAt: null },
      });
    } else if (type === "MONTH_FOLDER") {
      result = await (db.monthFolder as any).update({
        where: { id },
        data: { isArchived: false, deletedAt: null },
      });
    } else if (type === "DAY_FOLDER") {
      result = await (db.dayFolder as any).update({
        where: { id },
        data: { isArchived: false, deletedAt: null },
      });
    }

    revalidatePath(`/organization/${orgId}`);
    return { data: result };
  } catch (error) {
    console.error("Failed to restore item:", error);
    return { error: "Failed to restore item from trash." };
  }
};

export const restoreItem = createSafeAction(RestoreItem, handler);
