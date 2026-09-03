"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getUserTasks(orgId: string) {
  const { userId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  try {
    const data = await db.card.findMany({
      where: {
        list: { board: { orgId } },
        assignments: { some: { userId } },
      },
      select: {
        id: true,
        dueDate: true,
        status: true,
        list: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { data };
  } catch (error) {
    console.error("getUserTasks error:", error);
    return { error: "Failed to fetch user tasks" };
  }
}
