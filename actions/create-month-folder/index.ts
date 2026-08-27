"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-month-folder/types";
import { CreateMonthFolder } from "@/actions/create-month-folder/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, yearFolderId } = data;

  let monthFolder;

  try {
    monthFolder = await db.monthFolder.create({
      data: {
        title,
        yearFolderId,
      },
    });

    await createAuditLog({
      entityId: monthFolder.id,
      entityTitle: monthFolder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: monthFolder };
};

export const createMonthFolder = createSafeAction(CreateMonthFolder, handler);
