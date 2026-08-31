"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getTags() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return [];
  }

  try {
    const tags = await (db as any).tag.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
    });
    return tags;
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
}
