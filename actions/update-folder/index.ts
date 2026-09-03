"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { UpdateFolder } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { liveblocks } from "@/lib/liveblocks-server";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  if (orgRole !== "org:admin") {
    return {
      error: "Only administrators can update team folders.",
    };
  }

  const { id, title, logoUrl, password } = data;

  let folder;

  try {
    const updateData: any = {
      title,
      logoUrl: logoUrl || null,
    };
    
    if (password !== undefined) {
      updateData.password = password ? Buffer.from(password).toString('base64') : "";
    }

    folder = await db.folder.update({
      where: {
        id,
        orgId,
      },
      data: updateData,
    });

    await createAuditLog({
      entityId: folder.id,
      entityTitle: folder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.UPDATE,
    });
  } catch (error) {
    return {
      error: "Failed to update team folder.",
    };
  }

  try {
    await liveblocks.broadcastEvent(orgId, {
      type: "FOLDER_UPDATED",
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

export const updateFolder = createSafeAction(UpdateFolder, handler);
