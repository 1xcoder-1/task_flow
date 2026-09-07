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

    let compressedLogo = logoUrl;
    if (logoUrl && logoUrl.startsWith("data:image")) {
      try {
        const parts = logoUrl.split(",");
        if (parts.length === 2) {
          const sharp = (await import("sharp")).default;
          const buffer = Buffer.from(parts[1], "base64");
          const compressedBuffer = await sharp(buffer)
            .resize(160, 160, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();
          compressedLogo = `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
        }
      } catch (err) {
        console.error("Server logo compression error:", err);
      }
    }

    folder = await db.folder.create({
      data: {
        title,
        orgId,
        logoUrl: compressedLogo,
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
