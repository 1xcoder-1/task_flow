"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { UpdateCard } from "./schema";
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

  const { id, boardId, ...values } = data;

  const updateData: any = { ...values };

  if (values.status) {
    if (values.status === "DONE") {
      updateData.isActive = false;
    } else if (values.status === "IN_PROGRESS") {
      updateData.isActive = true;
    } else if (values.status === "PENDING") {
      updateData.isActive = false;
    }
  }

  try {
    const card = await db.card.update({
      where: {
        id,
        list: {
          board: {
            orgId,
          },
        },
      },
      data: updateData,
    });

    after(() => {
      createAuditLog({
        entityId: card.id,
        entityTitle: card.title,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.UPDATE,
      }).catch((error) => console.error("Failed to create audit log:", error));
      revalidatePath(`/board/${boardId}`);
      revalidatePath(`/organization/${orgId}`);
      revalidatePath(`/organization/${orgId}/daily-charts`);
    });

    return {
      data: card,
    };
  } catch (error) {
    return {
      error: "Failed to update.",
    };
  }
};

export const updateCard = createSafeAction(UpdateCard, handler);
