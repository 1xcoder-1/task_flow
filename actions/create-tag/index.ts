"use server";

import { auth } from "@clerk/nextjs/server";
import { CreateTag } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { name, color } = data;
  let tag;

  try {
    tag = await (db as any).tag.create({
      data: {
        name,
        color,
        orgId,
      },
    });
  } catch (error) {
    return { error: "Failed to create tag." };
  }

  return { data: tag };
};

export const createTag = createSafeAction(CreateTag, handler);
