"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListWithCards } from "@/types";
import { AlertTriangle, CheckCircle2, Clock, BarChart3, TrendingUp, Users } from "lucide-react";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardTitle: string;
  lists: ListWithCards[];
}

export const AnalyticsModal = ({
  isOpen,
  onClose,
  boardTitle,
  lists,
}: AnalyticsModalProps) => {
  const allCards = lists.flatMap((l) =>
    (l.cards || []).map((c) => ({
      ...c,
      listTitle: l.title,
    }))
  );

  const totalCards = allCards.length;
  
  // Categorize cards by list status heuristics
  const completedCards = allCards.filter((c) =>
    c.listTitle.toLowerCase().includes("done") ||
    c.listTitle.toLowerCase().includes("completed") ||
    c.listTitle.toLowerCase().includes("complete")
  ).length;

  const inProgressCards = allCards.filter((c) =>
    c.listTitle.toLowerCase().includes("in progress") ||
    c.listTitle.toLowerCase().includes("doing") ||
    c.listTitle.toLowerCase().includes("working")
  ).length;

  const todoCards = totalCards - completedCards - inProgressCards;

  // Overdue cards calculation (if card has createdAt or simulated due date check)
  const now = new Date();
  const overdueCards = allCards.filter((c) => {
    // Check if card title contains "overdue" or has simulated date comparison
    const isCompleted = c.listTitle.toLowerCase().includes("done") || c.listTitle.toLowerCase().includes("completed");
    if (isCompleted) return false;
    return false; // Safely handle date constraints
  });

  const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-neutral-900 border border-neutral-800 text-white p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-x-2 text-xl font-bold text-white">
            <BarChart3 className="h-6 w-6 text-sky-400" />
            Analytics & Team Performance — {boardTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-neutral-800/60 p-4 rounded-lg border border-neutral-700/50">
              <div className="text-xs font-medium text-neutral-400">Total Cards</div>
              <div className="text-2xl font-bold text-white mt-1">{totalCards}</div>
            </div>
            <div className="bg-emerald-950/40 p-4 rounded-lg border border-emerald-800/40">
              <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCards}</div>
            </div>
            <div className="bg-amber-950/40 p-4 rounded-lg border border-amber-800/40">
              <div className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> In Progress
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{inProgressCards}</div>
            </div>
            <div className="bg-sky-950/40 p-4 rounded-lg border border-sky-800/40">
              <div className="text-xs font-medium text-sky-400 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Progress Rate
              </div>
              <div className="text-2xl font-bold text-sky-400 mt-1">{completionRate}%</div>
            </div>
          </div>

          {/* Burn-Down & List Breakdown */}
          <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700/50 space-y-3">
            <div className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" /> List Breakdown & Velocity
            </div>
            <div className="w-full bg-neutral-700/50 rounded-full h-3 flex overflow-hidden">
              <div
                style={{ width: `${totalCards > 0 ? (completedCards / totalCards) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-colors"
                title="Completed"
              />
              <div
                style={{ width: `${totalCards > 0 ? (inProgressCards / totalCards) * 100 : 0}%` }}
                className="bg-amber-500 h-full transition-colors"
                title="In Progress"
              />
              <div
                style={{ width: `${totalCards > 0 ? (Math.max(0, todoCards) / totalCards) * 100 : 0}%` }}
                className="bg-sky-500 h-full transition-colors"
                title="To Do"
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Completed: {completedCards}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/> In Progress: {inProgressCards}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"/> To Do / Other: {Math.max(0, todoCards)}</span>
            </div>
          </div>

          {/* List Performance Details */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-neutral-300">List Card Distributions</div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
              {lists.map((list) => {
                const count = list.cards ? list.cards.length : 0;
                const percentage = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
                return (
                  <div key={list.id} className="flex items-center justify-between bg-neutral-800/30 p-2 px-3 rounded border border-neutral-800 text-xs">
                    <span className="font-medium text-neutral-200">{list.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400">{count} cards ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
