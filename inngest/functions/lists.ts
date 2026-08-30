import { inngest } from "../client";
import { db } from "@/lib/db";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

export const handleListCopy = inngest.createFunction(
  {
    id: "handle-list-copy",
    triggers: [{ event: "app/list.copy" }]
  },
  async ({ event, step }) => {
    // 1. Copy the cards
    await step.run("copy-list-cards", async () => {
      const listToCopy = await db.list.findUnique({
        where: { id: event.data.originalListId },
        include: { cards: true },
      });

      if (!listToCopy || listToCopy.cards.length === 0) return;

      await db.card.createMany({
        data: listToCopy.cards.map((card) => ({
          title: card.title,
          description: card.description,
          order: card.order,
          listId: event.data.newListId,
        })),
      });
    });

    // 2. Log activity
    await step.run("create-list-copy-audit-log", async () => {
      let userImage = "";
      let userName = "Unknown";
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(event.data.userId);
        userImage = user?.imageUrl || "";
        userName = `${user?.firstName || ""}${user?.lastName ? ` ${user.lastName}` : ''}`.trim() || "Unknown";
      } catch (error) {
        console.error("Failed to fetch user from Clerk", error);
      }

      await db.auditLog.create({
        data: {
          orgId: event.data.orgId,
          entityId: event.data.newListId,
          entityType: ENTITY_TYPE.LIST,
          entityTitle: event.data.newListTitle,
          action: ACTION.CREATE,
          userId: event.data.userId,
          userImage,
          userName,
        },
      });
    });

    return { success: true };
  }
);
