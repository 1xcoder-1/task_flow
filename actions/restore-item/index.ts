"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { RestoreItem } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

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
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.CARD,
        entityTitle: `restored card "${result.title}" successfully`,
        action: ACTION.UPDATE,
      });
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
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.LIST,
        entityTitle: `restored list "${result.title}" successfully`,
        action: ACTION.UPDATE,
      });
    } else if (type === "BOARD") {
      result = await (db.board as any).update({
        where: { id, orgId },
        data: { isArchived: false, deletedAt: null },
      });
      revalidatePath(`/organization/${orgId}`);
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.BOARD,
        entityTitle: `restored board "${result.title}" successfully`,
        action: ACTION.UPDATE,
      });
    } else if (type === "FOLDER") {
      result = await (db.folder as any).update({
        where: { id, orgId },
        data: { isArchived: false, deletedAt: null },
      });
      revalidatePath(`/organization/${orgId}`);
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.FOLDER,
        entityTitle: `restored folder "${result.title}" successfully`,
        action: ACTION.UPDATE,
      });
    } else if (type === "YEAR_FOLDER") {
      result = await (db.yearFolder as any).update({
        where: { id },
        data: { isArchived: false, deletedAt: null },
      });
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.FOLDER,
        entityTitle: `restored year folder "${result.title}" successfully`,
        action: ACTION.UPDATE,
      });
    } else if (type === "MONTH_FOLDER") {
      result = await (db.monthFolder as any).update({
        where: { id },
        data: { isArchived: false, deletedAt: null },
      });
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.FOLDER,
        entityTitle: `restored month folder "${result.title}" successfully`,
        action: ACTION.UPDATE,
      });
    } else if (type === "DAY_FOLDER") {
      result = await (db.dayFolder as any).update({
        where: { id },
        data: { isArchived: false, deletedAt: null },
      });
      await createAuditLog({
        entityId: id,
        entityType: ENTITY_TYPE.FOLDER,
        entityTitle: `restored day folder "${result.title}" successfully`,
        action: ACTION.UPDATE,
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
