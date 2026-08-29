"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const getFolders = async () => {
  const { orgId } = await auth();
  if (!orgId) return [];
  return await db.folder.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" }
  });
};

export const getYears = async (folderId: string) => {
  if (!folderId) return [];
  return await db.yearFolder.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" }
  });
};

export const getMonths = async (yearFolderId: string) => {
  if (!yearFolderId) return [];
  return await db.monthFolder.findMany({
    where: { yearFolderId },
    orderBy: { createdAt: "desc" }
  });
};

export const getDays = async (monthFolderId: string) => {
  if (!monthFolderId) return [];
  return await db.dayFolder.findMany({
    where: { monthFolderId },
    orderBy: { createdAt: "desc" }
  });
};

export const getBoards = async (dayFolderId: string) => {
  if (!dayFolderId) return [];
  return await db.board.findMany({
    where: { dayFolderId },
    orderBy: { createdAt: "desc" }
  });
};

export const getLists = async (boardId: string) => {
  if (!boardId) return [];
  return await db.list.findMany({
    where: { boardId },
    orderBy: { order: "asc" }
  });
};
