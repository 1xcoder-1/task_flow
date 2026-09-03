import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      deletedCards,
      deletedLists,
      deletedBoards,
      deletedFolders,
      deletedYearFolders,
      deletedMonthFolders,
      deletedDayFolders,
    ] = await Promise.all([
      (db.card as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
      (db.list as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
      (db.board as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
      (db.folder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
      (db.yearFolder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
      (db.monthFolder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
      (db.dayFolder as any).deleteMany({
        where: {
          isArchived: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      purged: {
        cards: deletedCards.count,
        lists: deletedLists.count,
        boards: deletedBoards.count,
        folders: deletedFolders.count + deletedYearFolders.count + deletedMonthFolders.count + deletedDayFolders.count,
      },
    });
  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ error: "Failed to cleanup trash" }, { status: 500 });
  }
}
