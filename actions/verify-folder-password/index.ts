"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { VerifyFolderPassword } from "./schema";
import bcrypt from "bcryptjs";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, password } = data;

  try {
    const folder = await db.folder.findUnique({
      where: {
        id,
        orgId,
      },
    });

    if (!folder) {
      return {
        error: "Folder not found",
      };
    }

    if (!folder.password) {
      // If there's no password on the folder, it's not protected, but the UI shouldn't hit this if it's not protected.
      // But we can just return success.
      return { data: { success: true } };
    }

    let isValid = false;
    if (folder.password.startsWith("$2a$") || folder.password.startsWith("$2b$")) {
      isValid = await bcrypt.compare(password, folder.password);
    } else {
      // Check if it's base64 encoded
      try {
        const decoded = Buffer.from(folder.password, 'base64').toString('utf-8');
        if (Buffer.from(decoded).toString('base64') === folder.password) {
          isValid = password === decoded;
        } else {
          isValid = password === folder.password;
        }
      } catch {
        isValid = password === folder.password;
      }
    }

    if (!isValid) {
      return {
        error: "Incorrect password",
      };
    }

    return { data: { success: true } };
  } catch (error) {
    return {
      error: "Failed to verify password",
    };
  }
};

export const verifyFolderPassword = createSafeAction(VerifyFolderPassword, handler);
