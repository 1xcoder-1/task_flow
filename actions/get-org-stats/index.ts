"use server";

import { unstable_noStore as noStore } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "./types";
import { GetOrgStats } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  noStore();
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId || data.orgId !== orgId || orgRole !== "org:admin") {
    return {
      error: "Unauthorized",
    };
  }

  try {
    let totalMembers = 0;
    try {
      const client = await clerkClient();
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      });
      totalMembers = memberships.totalCount || memberships.data.length;
    } catch (e) {
      console.error("Clerk error fetching members", e);
    }

    const activeTasks = await db.card.count({
      where: {
        list: {
          board: {
            orgId
          }
        },
        OR: [
          { isActive: true },
          { list: { title: "In Progress" } }
        ]
      }
    });

    return {
      data: {
        totalMembers,
        activeTasks,
        activeUsers: 0,
        offlineUsers: 0,
      }
    };
  } catch (error) {
    return {
      error: "Failed to fetch stats",
    };
  }
};

export const getOrgStats = createSafeAction(GetOrgStats, handler);
