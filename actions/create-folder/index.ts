"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-folder/types";
import { CreateFolder } from "@/actions/create-folder/schema";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { inngest } from "@/inngest/client";
import { liveblocks } from "@/lib/liveblocks-server";

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

    // Fire Inngest event to auto-generate year/month/day folders and audit log
    await inngest.send({
      name: "app/folder.create",
      data: {
        orgId,
        folderId: folder.id,
        folderTitle: folder.title,
        userId: userId,
      },
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  try {
    await liveblocks.broadcastEvent(orgId, {
      type: "FOLDER_CREATED",
      data: structuredClone({
        ...folder,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      }) as any,
    });
  } catch (error) {
    console.error("Liveblocks broadcast failed", error);
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: folder };
};

export const createFolder = createSafeAction(CreateFolder, handler);
