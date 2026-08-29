import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";;

import { ListContainer } from "./_components/list-container";
import { db } from "@/lib/db";

type BoardIdPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const [{ boardId }, { orgId }] = await Promise.all([params, auth()]);

  if (!orgId) redirect("/select-org");

  const lists = await db.list.findMany({
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
          comments: { select: { id: true } },
          attachments: { select: { id: true } },
          assignments: true,
        }
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  const board = await db.board.findUnique({
    where: { id: boardId }
  });

  return (
    <div className="p-4 h-full overflow-x-auto board-scrollbar">
      <ListContainer boardId={boardId} data={lists} isImpBoard={board?.isImpBoard || false} />
    </div>
  );
};

export default BoardIdPage;
