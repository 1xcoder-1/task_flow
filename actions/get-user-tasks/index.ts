"use server";

import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getUserTasks(orgId: string) {
  const { userId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  try {
    return { data: await getCachedUserTasks(orgId, userId) };
  } catch (error) {
    console.error("getUserTasks error:", error);
    return { error: "Failed to fetch user tasks" };
  }
}

const getCachedUserTasks = unstable_cache(
  (orgId: string, userId: string) => db.card.findMany({
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
  }),
  ["user-tasks"],
  { revalidate: 30 }
);
