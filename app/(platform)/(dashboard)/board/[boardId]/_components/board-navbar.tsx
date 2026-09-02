"use client";

import { useState } from "react";
import { Board } from "@prisma/client";
import { BarChart3, FileSpreadsheet } from "lucide-react";

import { BoardTitleForm } from "./board-title-form";
import { BoardOptions } from "./board-options";
import { BoardBackButton } from "./board-back-button";
import { BoardViewToggle, BoardViewMode } from "./board-view-toggle";
import { Button } from "@/components/ui/button";
import { AnalyticsModal } from "@/components/modals/analytics-modal";
import { ExportImportModal } from "@/components/modals/export-import-modal";

import { ListWithCards } from "@/types";

type BoardNavbarProps = {
  data: Board;
  lists?: ListWithCards[];
  viewMode?: BoardViewMode;
  onViewChange?: (mode: BoardViewMode) => void;
};

export const BoardNavbar = ({ data, lists = [], viewMode = "kanban", onViewChange }: BoardNavbarProps) => {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  return (
    <>
      <div className="w-full h-14 z-[40] bg-black/50 fixed top-0 flex items-center px-6 gap-x-4 text-white backdrop-blur-md">
        <BoardBackButton />
        <BoardTitleForm data={data} />

        {/* Always perfectly centered using absolute positioning */}
        {onViewChange && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <BoardViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-x-3">
          {/* Glassmorphism Header Action Buttons for Analytics & Export/Import */}
          <Button
            onClick={() => setIsAnalyticsOpen(true)}
            variant="transparent"
            size="sm"
            className="h-9 w-9 p-0 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400/50 rounded-[10%] shadow-sm backdrop-blur-sm transition-all duration-200"
            title="Analytics & Team Dashboards"
          >
            <BarChart3 className="h-4 w-4 text-sky-400" />
          </Button>

          <Button
            onClick={() => setIsExportImportOpen(true)}
            variant="transparent"
            size="sm"
            className="h-9 w-9 p-0 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/50 rounded-[10%] shadow-sm backdrop-blur-sm transition-all duration-200"
            title="Export & Import Board Data"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          </Button>

          <BoardOptions id={data.id} boardTitle={data.title} lists={lists} />
        </div>
      </div>


      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        boardTitle={data.title}
        lists={lists}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        boardId={data.id}
        boardTitle={data.title}
        lists={lists}
      />
    </>
  );
};
