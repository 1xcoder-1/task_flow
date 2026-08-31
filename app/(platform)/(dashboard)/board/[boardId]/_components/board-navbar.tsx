"use client";

import { Board } from "@prisma/client";

import { BoardTitleForm } from "./board-title-form";
import { BoardOptions } from "./board-options";
import { BoardBackButton } from "./board-back-button";
import { BoardViewToggle, BoardViewMode } from "./board-view-toggle";

type BoardNavbarProps = {
  data: Board;
  viewMode?: BoardViewMode;
  onViewChange?: (mode: BoardViewMode) => void;
};

export const BoardNavbar = ({ data, viewMode = "kanban", onViewChange }: BoardNavbarProps) => {
  return (
    <div className="w-full h-14 z-[40] bg-black/50 fixed top-0 flex items-center px-6 gap-x-4 text-white backdrop-blur-md">
      <BoardBackButton />
      <BoardTitleForm data={data} />

      {onViewChange && (
        <div className="mx-auto">
          <BoardViewToggle viewMode={viewMode} onViewChange={onViewChange} />
        </div>
      )}

      <div className="ml-auto">
        <BoardOptions id={data.id} />
      </div>
    </div>
  );
};
