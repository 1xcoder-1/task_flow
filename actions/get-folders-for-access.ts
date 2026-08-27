"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const getFoldersForAccess = async () => {
  const { orgId, orgRole } = await auth();

  if (!orgId || orgRole !== "org:admin") {
    throw new Error("Unauthorized");
  }

  const folders = await db.folder.findMany({
    where: { orgId },
    include: {
      accesses: true,
    },
    orderBy: {
      createdAt: "desc",
    }
  });

  return folders;
};
