import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BoardViewContainer } from "./_components/board-view-container";
import { db } from "@/lib/db";
import { getBoard } from "@/lib/get-board";

type BoardIdPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const [{ boardId }, { orgId }] = await Promise.all([params, auth()]);

  if (!orgId) redirect("/select-org");

  const board = await getBoard(boardId, orgId);

  if (!board) notFound();

  const lists = await (db.list as any).findMany({
    where: {
      boardId: boardId,
      isArchived: false,
      board: {
        orgId,
      },
    },
    include: {
      cards: {
        where: {
          isArchived: false,
        },
        orderBy: {
          order: "asc",
        },
        include: {
          _count: {
            select: {
              attachments: true,
              comments: true,
              subtasks: true,
            },
          },
          assignments: true,
          subtasks: {
            orderBy: {
              createdAt: "asc",
            },
          },
          comments: {
            orderBy: {
              createdAt: "asc",
            },
          },
          attachments: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return <BoardViewContainer board={board} lists={lists as any} />;
};

export default BoardIdPage;
