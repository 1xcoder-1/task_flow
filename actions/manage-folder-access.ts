"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface ManageFolderAccessProps {
  folderId: string;
  userId: string;
  action: "add" | "remove";
}

export const manageFolderAccess = async ({ folderId, userId, action }: ManageFolderAccessProps) => {
  const { orgId, orgRole } = await auth();

  if (!orgId || orgRole !== "org:admin") {
    throw new Error("Unauthorized");
  }

  // Ensure folder exists and belongs to the org
  const folder = await db.folder.findUnique({
    where: {
      id: folderId,
      orgId,
    }
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (action === "add") {
    await db.folderAccess.create({
      data: {
        folderId,
        userId,
      }
    });
  } else {
    await db.folderAccess.delete({
      where: {
        folderId_userId: {
          folderId,
          userId,
        }
      }
    });
  }

  revalidatePath(`/organization/${orgId}/settings`);
  
  return { success: true };
};
