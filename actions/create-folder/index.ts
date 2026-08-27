"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-folder/types";
import { CreateFolder } from "@/actions/create-folder/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import bcrypt from "bcryptjs";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, logoUrl, password } = data;

  let folder;

  try {
    let hashedPassword = "";
    if (password) {
      hashedPassword = Buffer.from(password).toString('base64');
    }

    folder = await db.folder.create({
      data: {
        title,
        orgId,
        logoUrl,
        password: hashedPassword,
      },
    });

    // create new activity log
    await createAuditLog({
      entityId: folder.id,
      entityTitle: folder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: folder };
};

export const createFolder = createSafeAction(CreateFolder, handler);
