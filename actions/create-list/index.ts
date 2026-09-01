"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { CreateList } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, boardId } = data;

  try {
    const [board, lastList] = await Promise.all([
      db.board.findUnique({
        where: { id: boardId, orgId },
        select: { id: true },
      }),
      db.list.findFirst({
        where: { boardId },
        orderBy: { order: "desc" },
        select: { order: true },
      }),
    ]);

    if (!board) {
      return {
        error: "Board not found",
      };
    }

    const list = await db.list.create({
      data: {
        title,
        boardId,
        order: lastList ? lastList.order + 1 : 1,
      },
    });

    after(() => {
      createAuditLog({
        entityId: list.id,
        entityTitle: list.title,
        entityType: ENTITY_TYPE.LIST,
        action: ACTION.CREATE,
      }).catch((error) => console.error("Failed to create list audit log:", error));
      revalidatePath(`/board/${boardId}`);
    });

    return {
      data: list,
    };
  } catch (error) {
    return {
      error: "Failed to create.",
    };
  }
};

export const createList = createSafeAction(CreateList, handler);
