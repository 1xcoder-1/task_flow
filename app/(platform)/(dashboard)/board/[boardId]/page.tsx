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
          comments: true,
          attachments: true,
          assignments: true,
        }
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="p-4 h-full overflow-x-auto board-scrollbar">
      <ListContainer boardId={boardId} data={lists} />
    </div>
  );
};

export default BoardIdPage;
