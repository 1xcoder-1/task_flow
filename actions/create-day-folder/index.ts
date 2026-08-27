"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-day-folder/types";
import { CreateDayFolder } from "@/actions/create-day-folder/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, monthFolderId } = data;

  let dayFolder;

  try {
    dayFolder = await db.dayFolder.create({
      data: {
        title,
        monthFolderId,
      },
    });

    await createAuditLog({
      entityId: dayFolder.id,
      entityTitle: dayFolder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: dayFolder };
};

export const createDayFolder = createSafeAction(CreateDayFolder, handler);
