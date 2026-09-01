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
    const query = searchParams.get("query")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ boards: [], lists: [], cards: [] });
    }

    const [boards, lists, cards] = await Promise.all([
      db.board.findMany({
        where: {
          orgId,
          title: {
            contains: query,
            mode: "insensitive",
          },
          isImpBoard: false,
          NOT: [
            { title: { equals: "Daily Tasks", mode: "insensitive" } },
            { title: { equals: "Imp Tasks daily", mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          imageThumbUrl: true,
          dayFolder: {
            select: {
              id: true,
              monthFolder: {
                select: {
                  id: true,
                  yearFolder: {
                    select: {
                      id: true,
                      folder: {
                        select: {
                          id: true,
                          title: true,
                          password: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.list.findMany({
        where: {
          board: {
            orgId,
          },
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 8,
        select: {
          id: true,
          title: true,
          boardId: true,
          board: {
            select: {
              title: true,
              dayFolder: {
                select: {
                  id: true,
                  monthFolder: {
                    select: {
                      id: true,
                      yearFolder: {
                        select: {
                          id: true,
                          folder: {
                            select: {
                              id: true,
                              title: true,
                              password: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.card.findMany({
        where: {
          list: {
            board: {
              orgId,
            },
          },
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 10,
        select: {
          id: true,
          title: true,
          priority: true,
          list: {
            select: {
              id: true,
              title: true,
              boardId: true,
              board: {
                select: {
                  title: true,
                  dayFolder: {
                    select: {
                      id: true,
                      monthFolder: {
                        select: {
                          id: true,
                          yearFolder: {
                            select: {
                              id: true,
                              folder: {
                                select: {
                                  id: true,
                                  title: true,
                                  password: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      boards: boards.map((b) => {
        const dayFolder = b.dayFolder;
        const monthFolder = dayFolder?.monthFolder;
        const yearFolder = monthFolder?.yearFolder;
        const folder = yearFolder?.folder;
        const hasPassword = Boolean(folder?.password && folder.password.trim().length > 0);
        const dayFolderUrl = (folder && yearFolder && monthFolder && dayFolder)
          ? `/organization/${orgId}/folder/${folder.id}/year/${yearFolder.id}/month/${monthFolder.id}/day/${dayFolder.id}`
          : null;

        return {
          id: b.id,
          title: b.title,
          type: "board",
          imageUrl: b.imageThumbUrl,
          folderId: folder?.id || null,
          folderTitle: folder?.title || null,
          isPasswordProtected: hasPassword,
          dayFolderUrl,
          url: `/board/${b.id}`,
        };
      }),
      lists: lists.map((l) => {
        const dayFolder = l.board?.dayFolder;
        const monthFolder = dayFolder?.monthFolder;
        const yearFolder = monthFolder?.yearFolder;
        const folder = yearFolder?.folder;
        const hasPassword = Boolean(folder?.password && folder.password.trim().length > 0);
        const dayFolderUrl = (folder && yearFolder && monthFolder && dayFolder)
          ? `/organization/${orgId}/folder/${folder.id}/year/${yearFolder.id}/month/${monthFolder.id}/day/${dayFolder.id}`
          : null;

        return {
          id: l.id,
          title: l.title,
          type: "list",
          boardId: l.boardId,
          boardTitle: l.board?.title || "Board",
          folderId: folder?.id || null,
          folderTitle: folder?.title || null,
          isPasswordProtected: hasPassword,
          dayFolderUrl,
          url: `/board/${l.boardId}`,
        };
      }),
      cards: cards.map((c) => {
        const dayFolder = c.list?.board?.dayFolder;
        const monthFolder = dayFolder?.monthFolder;
        const yearFolder = monthFolder?.yearFolder;
        const folder = yearFolder?.folder;
        const hasPassword = Boolean(folder?.password && folder.password.trim().length > 0);
        const dayFolderUrl = (folder && yearFolder && monthFolder && dayFolder)
          ? `/organization/${orgId}/folder/${folder.id}/year/${yearFolder.id}/month/${monthFolder.id}/day/${dayFolder.id}`
          : null;

        return {
          id: c.id,
          title: c.title,
          type: "card",
          priority: c.priority,
          boardId: c.list?.boardId,
          boardTitle: c.list?.board?.title || "Board",
          listTitle: c.list?.title || "List",
          folderId: folder?.id || null,
          folderTitle: folder?.title || null,
          isPasswordProtected: hasPassword,
          dayFolderUrl,
          url: `/board/${c.list?.boardId}?cardId=${c.id}`,
        };
      }),
    });
  } catch (error) {
    console.error("[SEARCH_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


