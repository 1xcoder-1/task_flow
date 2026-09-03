"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { GetOrgStats } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId || data.orgId !== orgId) {
    return {
      error: "Unauthorized",
    };
  }

  try {
    const [activeTasks, totalTeams, totalBoards, totalCards, completedTasks] = await Promise.all([
      db.card.count({
        where: {
          list: { board: { orgId } },
          OR: [{ isActive: true }, { status: "IN_PROGRESS" }],
        },
      }),
      db.folder.count({
        where: {
          orgId,
          NOT: {
            title: {
              equals: "Important",
              mode: "insensitive",
            },
          },
        },
      }),
      db.board.count({
        where: { orgId },
      }),
      db.card.count({
        where: { list: { board: { orgId } } },
      }),
      db.card.count({
        where: {
          list: { board: { orgId } },
          status: "DONE",
        },
      }),
    ]);

    return {
      data: {
        totalMembers: 0,
        activeTasks,
        totalTeams,
        totalBoards,
        totalCards,
        completedTasks,
        activeUsers: 0,
        offlineUsers: 0,
      },
    };
  } catch {
    return {
      error: "Failed to fetch stats",
    };
  }
};

export const getOrgStats = createSafeAction(GetOrgStats, handler);
