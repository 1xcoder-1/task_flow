"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-year-folder/types";
import { CreateYearFolder } from "@/actions/create-year-folder/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, folderId } = data;

  let yearFolder;

  try {
    yearFolder = await db.yearFolder.create({
      data: {
        title,
        folderId,
      },
    });

    await createAuditLog({
      entityId: yearFolder.id,
      entityTitle: yearFolder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/organization/${orgId}/folder/${folderId}`);
  return { data: yearFolder };
};

export const createYearFolder = createSafeAction(CreateYearFolder, handler);
