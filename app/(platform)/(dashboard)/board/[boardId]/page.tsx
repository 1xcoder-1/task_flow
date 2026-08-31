import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BoardViewContainer } from "./_components/board-view-container";
import { db } from "@/lib/db";

type BoardIdPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const [{ boardId }, { orgId }] = await Promise.all([params, auth()]);

  if (!orgId) redirect("/select-org");

  const board = await db.board.findUnique({
    where: {
      id: boardId,
      orgId,
    },
  });

  if (!board) notFound();

  const lists = await (db.list as any).findMany({
    where: {
      boardId: boardId,
      board: {
        orgId,
      },
    },
    include: {
      cards: {
        orderBy: {
          order: "asc",
        },
        include: {
          comments: true,
          attachments: true,
          assignments: true,
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
