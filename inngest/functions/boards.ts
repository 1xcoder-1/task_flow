import { inngest } from "../client";
import { db } from "@/lib/db";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

export const handleBoardCreate = inngest.createFunction(
  {
    id: "handle-board-create",
    triggers: [{ event: "app/board.create" }]
  },
  async ({ event, step }) => {
    // 1. Generate default lists for the board
    await step.run("generate-default-lists", async () => {
      await db.list.createMany({
        data: [
          { title: "Pending", order: 1, boardId: event.data.boardId },
          { title: "In Progress", order: 2, boardId: event.data.boardId },
          { title: "Done", order: 3, boardId: event.data.boardId }
        ]
      });
    });

    // 2. Create audit log for the board
    await step.run("create-board-audit-log", async () => {
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
          entityId: event.data.boardId,
          entityType: ENTITY_TYPE.BOARD,
          entityTitle: event.data.boardTitle,
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
