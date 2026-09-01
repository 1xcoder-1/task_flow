"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { CreateCard } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { liveblocks } from "@/lib/liveblocks-server";
import { statusFromListTitle } from "@/lib/card-status";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, boardId, listId, targetListId } = data;

  try {
    const list = await db.list.findUnique({
      where: {
        id: listId,
        board: {
          orgId,
        },
      },
      select: { id: true, title: true },
    });

    if (!list) {
      return {
        error: "List not found.",
      };
    }

    const lastCard = await db.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;
    let linkedCardId = null;
    const listStatus = statusFromListTitle(list.title);

    if (targetListId) {
      const targetList = await db.list.findUnique({
        where: { id: targetListId, board: { orgId } },
        select: { id: true, title: true },
      });
      if (targetList) {
        const lastTargetCard = await db.card.findFirst({
          where: { listId: targetListId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const newTargetOrder = lastTargetCard ? lastTargetCard.order + 1 : 1;
        const targetStatus = statusFromListTitle(targetList.title);
        const targetCard = await db.card.create({
          data: {
            title,
            listId: targetListId,
            order: newTargetOrder,
            status: targetStatus.status,
            isActive: targetStatus.isActive,
          },
        });
        linkedCardId = targetCard.id;
      }
    }

    const card = await db.card.create({
      data: {
        title,
        listId,
        order: newOrder,
        linkedCardId,
        status: listStatus.status,
        isActive: listStatus.isActive,
      },
    });

    after(() => {
      Promise.all([
        createAuditLog({
          entityId: card.id,
          entityTitle: card.title,
          entityType: ENTITY_TYPE.CARD,
          action: ACTION.CREATE,
        }),
        linkedCardId
          ? createAuditLog({
              entityId: linkedCardId,
              entityTitle: title,
              entityType: ENTITY_TYPE.CARD,
              action: ACTION.CREATE,
            })
          : Promise.resolve(),
        liveblocks.broadcastEvent(boardId, {
          type: "CARD_CREATED",
          data: JSON.parse(JSON.stringify(card)),
        }).catch((error) => console.error("Liveblocks broadcast failed", error)),
      ]).catch((error) => console.error("Failed to finish card create side effects:", error));

      revalidatePath(`/board/${boardId}`);
    });

    return {
      data: card,
    };
  } catch (error) {
    return {
      error: "Failed to create.",
    };
  }
};

export const createCard = createSafeAction(CreateCard, handler);
