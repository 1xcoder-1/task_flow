"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { DeleteNestedFolder } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, type, path } = data;
  let deletedFolder;

  try {
    if (type === "year") {
      deletedFolder = await (db.yearFolder as any).update({
        where: { id },
        data: { isArchived: true, deletedAt: new Date() },
      });
    } else if (type === "month") {
      deletedFolder = await (db.monthFolder as any).update({
        where: { id },
        data: { isArchived: true, deletedAt: new Date() },
      });
    } else if (type === "day") {
      deletedFolder = await (db.dayFolder as any).update({
        where: { id },
        data: { isArchived: true, deletedAt: new Date() },
      });
    } else {
      return { error: "Invalid folder type" };
    }

    await createAuditLog({
      entityId: deletedFolder.id,
      entityTitle: deletedFolder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return {
      error: "Failed to delete.",
    };
  }

  revalidatePath(path);
  return { data: deletedFolder };
};

export const deleteNestedFolder = createSafeAction(DeleteNestedFolder, handler);
