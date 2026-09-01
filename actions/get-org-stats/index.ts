"use server";

import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { GetOrgStats } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId || data.orgId !== orgId) {
    return {
      error: "Unauthorized",
    };
  }

  try {
    return { data: await getCachedOrgStats(orgId) };
  } catch {
    return {
      error: "Failed to fetch stats",
    };
  }
};

const getCachedOrgStats = unstable_cache(
  async (orgId: string) => {
    const activeTasks = await db.card.count({
      where: {
        list: { board: { orgId } },
        OR: [{ isActive: true }, { status: "IN_PROGRESS" }],
      },
    });

    return {
      totalMembers: 0,
      activeTasks,
      activeUsers: 0,
      offlineUsers: 0,
    };
  },
  ["org-stats"],
  { revalidate: 30 }
);

export const getOrgStats = createSafeAction(GetOrgStats, handler);
