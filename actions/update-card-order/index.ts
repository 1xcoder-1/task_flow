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
    const transaction = items.map((card) =>
      db.card.update({
        where: {
          id: card.id,
        },
        data: {
          order: card.order,
          listId: card.listId,
        },
      })
    );

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
