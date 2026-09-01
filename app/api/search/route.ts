import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = query.trim();

    // Search cards
    const cards = await db.card.findMany({
      where: {
        list: { board: { orgId } },
        title: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      include: {
        list: {
          include: {
            board: {
              include: {
                dayFolder: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    // Search boards
    const boards = await db.board.findMany({
      where: {
        orgId,
        title: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      include: {
        dayFolder: true,
      },
      take: 10,
    });

    // Search folders
    const folders = await db.folder.findMany({
      where: {
        orgId,
        title: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      take: 10,
    });

    const results = [
      ...cards.map((card) => ({
        id: card.id,
        type: "card" as const,
        title: card.title,
        subtitle: `${card.list.board.title} • ${card.list.title}`,
        url: `/board/${card.list.board.id}`,
        icon: "📝",
      })),
      ...boards.map((board) => ({
        id: board.id,
        type: "board" as const,
        title: board.title,
        subtitle: board.dayFolder?.title || "Board",
        url: `/board/${board.id}`,
        icon: "📋",
      })),
      ...folders.map((folder) => ({
        id: folder.id,
        type: "folder" as const,
        title: folder.title,
        subtitle: "Folder",
        url: `/organization/${folder.orgId}/folder/${folder.id}`,
        icon: "📁",
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
