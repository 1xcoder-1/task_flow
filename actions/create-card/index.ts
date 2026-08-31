"use server";

import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";;

import { CreateCard } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { liveblocks } from "@/lib/liveblocks-server";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, boardId, listId, targetListId } = data;

  let card;

  try {
    const list = await db.list.findUnique({
      where: {
        id: listId,
        board: {
          orgId,
        },
      },
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

    if (targetListId) {
      const targetList = await db.list.findUnique({
        where: { id: targetListId, board: { orgId } },
      });
      if (targetList) {
        const lastTargetCard = await db.card.findFirst({
          where: { listId: targetListId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const newTargetOrder = lastTargetCard ? lastTargetCard.order + 1 : 1;
        const targetCard = await db.card.create({
          data: {
            title,
            listId: targetListId,
            order: newTargetOrder,
          },
        });
        linkedCardId = targetCard.id;
        
        await createAuditLog({
          entityId: targetCard.id,
          entityTitle: targetCard.title,
          entityType: ENTITY_TYPE.CARD,
          action: ACTION.CREATE,
        });
      }
    }

    card = await db.card.create({
      data: {
        title,
        listId,
        order: newOrder,
        linkedCardId,
      },
    });

    // create new activity log
    await createAuditLog({
      entityId: card.id,
      entityTitle: card.title,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create.",
    };
  }

  // Broadcast to liveblocks room for this board
  try {
    await liveblocks.broadcastEvent(boardId, {
      type: "CARD_CREATED",
      data: JSON.parse(JSON.stringify(card)),
    });
  } catch (error) {
    console.error("Liveblocks broadcast failed", error);
  }

  revalidatePath(`/board/${boardId}`);

  return {
    data: card,
  };
};

export const createCard = createSafeAction(CreateCard, handler);
