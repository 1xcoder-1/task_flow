"use client";

import { LayoutList, Calendar as CalendarIcon, GanttChart } from "lucide-react";

export type BoardViewMode = "kanban" | "calendar" | "timeline";

interface BoardViewToggleProps {
  viewMode: BoardViewMode;
  onViewChange: (mode: BoardViewMode) => void;
}

export const BoardViewToggle = ({ viewMode, onViewChange }: BoardViewToggleProps) => {
  return (
    <div className="flex items-center bg-black/40 border border-white/20 p-0.5 rounded-lg shadow-inner">
      <button
        type="button"
        onClick={() => onViewChange("kanban")}
        className={`flex items-center gap-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
          viewMode === "kanban"
            ? "bg-white text-black shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
      >
        <LayoutList className="h-3.5 w-3.5" />
        Kanban
      </button>

      <button
        type="button"
        onClick={() => onViewChange("calendar")}
        className={`flex items-center gap-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
          viewMode === "calendar"
            ? "bg-white text-black shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        Calendar
      </button>

      <button
        type="button"
        onClick={() => onViewChange("timeline")}
        className={`flex items-center gap-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
          viewMode === "timeline"
            ? "bg-white text-black shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
      >
        <GanttChart className="h-3.5 w-3.5" />
        Timeline
      </button>
    </div>
  );
};
