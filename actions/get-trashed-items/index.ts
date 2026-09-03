"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getTrashedItems() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized", data: null };
  }

  try {
    // Auto-purge items soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await Promise.all([
      (db.card as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          list: { board: { orgId } },
        },
      }),
      (db.list as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          board: { orgId },
        },
      }),
      (db.board as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          orgId,
        },
      }),
      (db.folder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          orgId,
        },
      }),
      (db.yearFolder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          folder: { orgId },
        },
      }),
      (db.monthFolder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          yearFolder: { folder: { orgId } },
        },
      }),
      (db.dayFolder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
          monthFolder: { yearFolder: { folder: { orgId } } },
        },
      }),
    ]);

    const [
      cards,
      lists,
      boards,
      folders,
      yearFolders,
      monthFolders,
      dayFolders,
    ] = await Promise.all([
      (db.card as any).findMany({
        where: {
          isArchived: true,
          list: {
            board: {
              orgId,
            },
          },
        },
        include: {
          list: {
            select: {
              title: true,
              board: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: { deletedAt: "desc" },
      }),
      (db.list as any).findMany({
        where: {
          isArchived: true,
          board: {
            orgId,
          },
        },
        include: {
          board: {
            select: { id: true, title: true },
          },
          _count: {
            select: { cards: true },
          },
        },
        orderBy: { deletedAt: "desc" },
      }),
      (db.board as any).findMany({
        where: {
          isArchived: true,
          orgId,
        },
        orderBy: { deletedAt: "desc" },
      }),
      (db.folder as any).findMany({
        where: {
          isArchived: true,
          orgId,
        },
        orderBy: { deletedAt: "desc" },
      }),
      (db.yearFolder as any).findMany({
        where: {
          isArchived: true,
          folder: { orgId },
        },
        include: { folder: { select: { title: true } } },
        orderBy: { deletedAt: "desc" },
      }),
      (db.monthFolder as any).findMany({
        where: {
          isArchived: true,
          yearFolder: { folder: { orgId } },
        },
        include: { yearFolder: { select: { title: true } } },
        orderBy: { deletedAt: "desc" },
      }),
      (db.dayFolder as any).findMany({
        where: {
          isArchived: true,
          monthFolder: { yearFolder: { folder: { orgId } } },
        },
        include: { monthFolder: { select: { title: true } } },
        orderBy: { deletedAt: "desc" },
      }),
    ]);

    const allFolders = [
      ...folders.map((f: any) => ({ ...f, folderType: "FOLDER" })),
      ...yearFolders.map((yf: any) => ({ ...yf, folderType: "YEAR_FOLDER", subtitle: `Year Folder (Team: ${yf.folder?.title || ''})` })),
      ...monthFolders.map((mf: any) => ({ ...mf, folderType: "MONTH_FOLDER", subtitle: `Month Folder (Year: ${mf.yearFolder?.title || ''})` })),
      ...dayFolders.map((df: any) => ({ ...df, folderType: "DAY_FOLDER", subtitle: `Day Folder (Month: ${df.monthFolder?.title || ''})` })),
    ].sort((a: any, b: any) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());

    return {
      data: {
        cards: cards || [],
        lists: lists || [],
        boards: boards || [],
        folders: allFolders || [],
      },
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch trashed items:", error);
    return { error: "Failed to fetch trashed items", data: null };
  }
}
