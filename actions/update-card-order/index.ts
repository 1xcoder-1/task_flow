"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";;

import { UpdateCardOrder } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { items, boardId } = data;

  let updatedCards;

  // Verify the user has access to this board
  const board = await db.board.findUnique({
    where: {
      id: boardId,
      orgId,
    },
  });

  if (!board) {
    return { error: "Board not found or unauthorized" };
  }

  try {
    const lists = await db.list.findMany({
      where: { boardId },
      select: { id: true, title: true },
    });
    const listMap = new Map(lists.map(l => [l.id, l.title.toLowerCase()]));

    const transaction = items.map((card) => {
      const listTitle = listMap.get(card.listId) || "";
      let isActive = undefined;
      let status = undefined;

      if (listTitle.includes("in progress")) {
        isActive = true;
        status = "IN_PROGRESS";
      } else if (listTitle.includes("done")) {
        isActive = false;
        status = "DONE";
      }

      return db.card.update({
        where: {
          id: card.id,
        },
        data: {
          order: card.order,
          listId: card.listId,
          ...(isActive !== undefined && { isActive }),
          ...(status !== undefined && { status }),
        },
      });
    });

    updatedCards = await db.$transaction(transaction);
  } catch (error) {
    console.error("Failed to update card order:", error);
    return {
      error: "Failed to update.",
    };
  }

  revalidatePath(`/board/${boardId}`);
  return {
    data: updatedCards,
  };
};

export const updateCardOrder = createSafeAction(UpdateCardOrder, handler);
