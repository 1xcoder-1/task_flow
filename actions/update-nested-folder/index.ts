"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { UpdateNestedFolder } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, title, type, path } = data;
  let updatedFolder;

  try {
    if (type === "year") {
      updatedFolder = await db.yearFolder.update({
        where: { id },
        data: { title },
      });
    } else if (type === "month") {
      updatedFolder = await db.monthFolder.update({
        where: { id },
        data: { title },
      });
    } else if (type === "day") {
      updatedFolder = await db.dayFolder.update({
        where: { id },
        data: { title },
      });
    } else {
      return { error: "Invalid folder type" };
    }

    await createAuditLog({
      entityId: updatedFolder.id,
      entityTitle: updatedFolder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.UPDATE,
    });
  } catch (error) {
    return {
      error: "Failed to update.",
    };
  }

  revalidatePath(path);
  return { data: updatedFolder };
};

export const updateNestedFolder = createSafeAction(UpdateNestedFolder, handler);
