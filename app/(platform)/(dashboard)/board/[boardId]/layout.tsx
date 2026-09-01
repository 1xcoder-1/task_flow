import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";;

import { BoardNavbar } from "./_components/board-navbar";
import { getBoard } from "@/lib/get-board";
import { LiveblocksAppProvider } from "@/components/providers/liveblocks-provider";
import { LiveblocksRoomProvider } from "@/components/providers/liveblocks-room-provider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const [{ boardId }, { orgId }] = await Promise.all([params, auth()]);

  if (!orgId) return { title: "Board" };

  const board = await getBoard(boardId, orgId);

  return {
    title: board?.title || "Board",
  };
}

const BoardIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ boardId: string }>;
}) => {
  const [{ boardId }, { orgId }] = await Promise.all([params, auth()]);

  if (!orgId) redirect("/select-org");

  const board = await getBoard(boardId, orgId);

  if (!board) notFound();

  return (
    <LiveblocksAppProvider>
      <LiveblocksRoomProvider roomId={board.orgId}>
        <LiveblocksRoomProvider roomId={boardId}>
          <div
            style={{ backgroundImage: `url(${board.imageFullUrl})` }}
            className="relative h-full bg-no-repeat bg-cover bg-center"
          >
            <div aria-hidden className="absolute inset-0 bg-black/10" />
            <main className="relative h-full">{children}</main>
          </div>
        </LiveblocksRoomProvider>
      </LiveblocksRoomProvider>
    </LiveblocksAppProvider>
  );
};

export default BoardIdLayout;
