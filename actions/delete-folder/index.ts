"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { DeleteFolder } from "./schema";
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
      error: "Only administrators can delete team folders.",
    };
  }

  const { id } = data;

  let folder;

  try {
    folder = await db.folder.delete({
      where: {
        id,
        orgId,
      },
    });

    await createAuditLog({
      entityId: folder.id,
      entityTitle: folder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return {
      error: "Failed to delete team folder.",
    };
  }

  try {
    await liveblocks.broadcastEvent(orgId, {
      type: "FOLDER_DELETED",
      data: JSON.parse(JSON.stringify(folder)),
    });
  } catch (error) {
    console.error("Liveblocks broadcast failed", error);
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: folder };
};

export const deleteFolder = createSafeAction(DeleteFolder, handler);
