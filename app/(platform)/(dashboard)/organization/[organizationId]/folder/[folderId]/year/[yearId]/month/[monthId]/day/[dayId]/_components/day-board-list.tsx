import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { User2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { FormPopover } from "@/components/form/form-popover";
import { db } from "@/lib/db";
import { BoardCardOptionsModal } from "@/components/modals/board-card-options-modal";
import { BoardLink } from "@/components/board-link";

interface DayBoardListProps {
  dayFolderId: string;
}

const getDayBoards = unstable_cache(
  (orgId: string, dayFolderId: string) => (db.board as any).findMany({
    where: { orgId, dayFolderId, isArchived: false },
    orderBy: { createdAt: "desc" },
  }),
  ["day-boards"],
  { revalidate: 30 }
);

export const DayBoardList = async ({ dayFolderId }: DayBoardListProps) => {
  const { orgId } = await auth();

  if (!orgId) return redirect("/select-org");

  const boards = await getDayBoards(orgId, dayFolderId);

  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
        <User2 className="h-6 w-6 mr-2" />
        Your Boards
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-h-[calc(100vh-200px)] p-1">
        {boards.map((board: any) => (
          <div key={board.id} className="group relative aspect-video bg-sky-700 rounded-xl shadow-sm h-full w-full overflow-hidden hover:shadow-md transition">
            <BoardLink
              href={`/board/${board.id}`}
              style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
              className="absolute inset-0 block h-full w-full bg-no-repeat bg-center bg-cover"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"
              />
              <div className="relative p-3 h-full flex flex-col justify-between pointer-events-none">
                <p className="font-semibold text-white drop-shadow-md tracking-wide">{board.title}</p>
              </div>
            </BoardLink>
            {!board.isImpBoard && (
              <BoardCardOptionsModal board={{ id: board.id, title: board.title }} />
            )}
          </div>
        ))}
        <FormPopover sideOffset={10} side="right">
          <div
            role="button"
            className="relative aspect-video h-full w-full bg-slate-50/50 backdrop-blur-sm rounded-xl flex flex-col gap-y-2 items-center justify-center border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100/50 shadow-sm transition group"
          >
            <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800 tracking-wide">Create new board</p>
          </div>
        </FormPopover>
      </div>
    </div>
  );
};

DayBoardList.Skeleton = function SkeletonDayBoardList() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
    </div>
  );
};
