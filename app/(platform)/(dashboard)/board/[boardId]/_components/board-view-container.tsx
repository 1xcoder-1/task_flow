"use client";

import { useState } from "react";
import { Board } from "@prisma/client";
import { BoardNavbar } from "./board-navbar";
import { BoardViewMode } from "./board-view-toggle";
import { ListContainer } from "./list-container";
import { CalendarView } from "./calendar-view";
import { TimelineView } from "./timeline-view";
import type { ListWithCards } from "@/types";

interface BoardViewContainerProps {
  board: Board;
  lists: ListWithCards[];
}

export const BoardViewContainer = ({ board, lists }: BoardViewContainerProps) => {
  const [viewMode, setViewMode] = useState<BoardViewMode>("kanban");

  // Flatten all cards from all lists for Calendar and Timeline views
  const allCards = lists.flatMap((list) =>
    (list.cards || []).map((card) => ({
      ...card,
      list: { title: list.title },
    }))
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Navbar with View Toggle */}
      <BoardNavbar data={board} viewMode={viewMode} onViewChange={setViewMode} />

      {/* Main Content Area based on View Mode */}
      <div className="flex-1 pt-[68px] p-4 overflow-hidden h-full">
        {viewMode === "kanban" && (
          <ListContainer boardId={board.id} data={lists} isImpBoard={board.isImpBoard} />
        )}
        {(viewMode === "calendar" || viewMode === "timeline") && (
          <div className="h-full w-full rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-4 overflow-hidden flex flex-col">
            {viewMode === "calendar" && <CalendarView cards={allCards} />}
            {viewMode === "timeline" && <TimelineView cards={allCards} />}
          </div>
        )}
      </div>
    </div>
  );
};
