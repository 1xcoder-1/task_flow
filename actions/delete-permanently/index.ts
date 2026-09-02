"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { DeletePermanently } from "./schema";
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

    if (type === "EMPTY_TRASH") {
      await (db.card as any).deleteMany({
        where: {
          isArchived: true,
          list: { board: { orgId } },
        },
      });
      await (db.list as any).deleteMany({
        where: {
          isArchived: true,
          board: { orgId },
        },
      });
      await (db.board as any).deleteMany({
        where: {
          isArchived: true,
          orgId,
        },
      });
      await (db.folder as any).deleteMany({
        where: {
          isArchived: true,
          orgId,
        },
      });
      await (db.yearFolder as any).deleteMany({
        where: {
          isArchived: true,
          folder: { orgId },
        },
      });
      await (db.monthFolder as any).deleteMany({
        where: {
          isArchived: true,
          yearFolder: { folder: { orgId } },
        },
      });
      await (db.dayFolder as any).deleteMany({
        where: {
          isArchived: true,
          monthFolder: { yearFolder: { folder: { orgId } } },
        },
      });

      result = { success: true };
    } else if (type === "CARD" && id) {
      result = await (db.card as any).delete({
        where: { id },
      });
      if (boardId) revalidatePath(`/board/${boardId}`);
    } else if (type === "LIST" && id) {
      result = await (db.list as any).delete({
        where: { id },
      });
      if (boardId) revalidatePath(`/board/${boardId}`);
    } else if (type === "BOARD" && id) {
      result = await (db.board as any).delete({
        where: { id, orgId },
      });
    } else if (type === "FOLDER" && id) {
      result = await (db.folder as any).delete({
        where: { id, orgId },
      });
    } else if (type === "YEAR_FOLDER" && id) {
      result = await (db.yearFolder as any).delete({
        where: { id },
      });
    } else if (type === "MONTH_FOLDER" && id) {
      result = await (db.monthFolder as any).delete({
        where: { id },
      });
    } else if (type === "DAY_FOLDER" && id) {
      result = await (db.dayFolder as any).delete({
        where: { id },
      });
    }

    revalidatePath(`/organization/${orgId}`);
    return { data: result };
  } catch (error) {
    console.error("Failed to delete permanently:", error);
    return { error: "Failed to permanently delete item." };
  }
};

export const deletePermanently = createSafeAction(DeletePermanently, handler);
