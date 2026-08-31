"use server";

import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getUserTasks(orgId: string) {
  noStore();
  const { userId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  try {
    const cards = await db.card.findMany({
      where: {
        list: {
          board: {
            orgId,
          },
        },
        assignments: {
          some: {
            userId,
          },
        },
      },
      include: {
        list: {
          select: {
            id: true,
            title: true,
            board: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        assignments: true,
        subtasks: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return { data: cards };
  } catch (error) {
    console.error("getUserTasks error:", error);
    return { error: "Failed to fetch user tasks" };
  }
}
