"use client";

import { useState } from "react";
import Image from "next/image";
import { useCardModal } from "@/hooks/use-card-modal";
import { GanttChart, Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, ListTodo } from "lucide-react";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import { useCardAssignments, useCardOverlay } from "@/hooks/use-card-assignment-overlay";

interface TimelineViewProps {
  cards: any[];
}

const ITEMS_PER_PAGE = 8;

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500/30 text-red-100 border-red-500/50",
  high: "bg-orange-500/30 text-orange-100 border-orange-500/50",
  medium: "bg-yellow-500/30 text-yellow-100 border-yellow-500/50",
  low: "bg-emerald-500/30 text-emerald-100 border-emerald-500/50",
};

const isOverdueCard = (card: any) =>
  card.dueDate && new Date(card.dueDate) < new Date() && !card.isActive;

export const TimelineView = ({ cards }: TimelineViewProps) => {
  const cardModal = useCardModal();
  const [currentPage, setCurrentPage] = useState(1);

  // Sort cards chronologically: due date first, then creation date
  const sortedCards = [...cards].sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  const totalPages = Math.ceil(sortedCards.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCards = sortedCards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-x-3">
          <div className="p-2.5 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-xl shadow-inner">
            <GanttChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight drop-shadow-sm">
              Timeline & Schedule
            </h2>
            <p className="text-xs text-white/70 font-medium">
              Showing {sortedCards.length} tasks scheduled chronologically
            </p>
          </div>
        </div>

        {/* Pagination Buttons */}
        {sortedCards.length > 0 && (
          <div className="flex items-center gap-x-3 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm backdrop-blur-sm">
            <span className="text-xs font-semibold text-white/90 drop-shadow-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage === 1}
                aria-label="Previous timeline page"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="Next timeline page"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto cal-scrollbar space-y-3 pr-2">
        {paginatedCards.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <ListTodo className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-white/60 text-sm font-medium">No tasks found on this board.</p>
          </div>
        ) : (
          paginatedCards.map((card, i) => {
            const globalIndex = startIndex + i;
            const hasDueDate = !!card.dueDate;
            const overdue = isOverdueCard(card);
            const dueDateFormatted = hasDueDate
              ? new Date(card.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : "No due date";

            const createdFormatted = new Date(card.createdAt).toLocaleDateString("en-US", {
               month: "short",
               day: "numeric",
               timeZone: "UTC",
            });

            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                aria-label={`Open card: ${card.title}`}
                onClick={() => cardModal.onOpen(card.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    cardModal.onOpen(card.id);
                  }
                }}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer shadow-md backdrop-blur-sm ${
                  overdue
                    ? "bg-red-950/60 border-red-500/50 hover:bg-red-900/70"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {/* Left side: Index + Title + Badges */}
                <div className="flex items-start gap-x-4 min-w-0">
                  <div className={`mt-0.5 shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border ${
                    overdue
                      ? "bg-red-500/30 text-red-100 border-red-500/50"
                      : card.isActive
                      ? "bg-emerald-500/30 text-emerald-100 border-emerald-500/50"
                      : "bg-white/10 text-white border-white/20"
                  }`}>
                    {globalIndex + 1}
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-x-2 flex-wrap">
                      <span className="font-bold text-white text-[15px] drop-shadow-md truncate group-hover:text-orange-300 transition">
                        {card.title}
                      </span>
                    </div>

                    <TimelineCardMeta card={card} overdue={overdue} />
                  </div>
                </div>

                {/* Right side: Dates & Assignees */}
                <div className="flex items-center gap-x-6 text-xs shrink-0">
                  <div className="flex flex-col gap-1 text-right">
                    <span className={`flex items-center gap-x-1.5 font-bold justify-end drop-shadow-md ${
                      overdue ? "text-red-300" : "text-orange-400"
                    }`}>
                      <CalendarIcon className="h-4 w-4" />
                      {dueDateFormatted}
                    </span>
                    <span className="flex items-center gap-x-1.5 text-white/60 text-[11px] font-semibold justify-end">
                      <Clock className="h-3 w-3" />
                      Created {createdFormatted}
                    </span>
                  </div>

                  <TimelineAssignees cardId={card.id} assignments={card.assignments} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const TimelineCardMeta = ({ card, overdue }: { card: any; overdue: boolean }) => {
  const overlay = useCardOverlay(card.id);
  const priority = overlay?.priority ?? card.priority;
  const tags = overlay?.tags ?? card.tags ?? [];
  const isActive = overlay?.isActive ?? card.isActive;

  return (
    <>
      <div className="flex items-center flex-wrap gap-2">
        {priority && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border tracking-wider ${
            PRIORITY_STYLES[priority.toLowerCase()] || "bg-white/10 text-white/90 border-white/20"
          }`}>
            {priority}
          </span>
        )}

        {overdue && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/40 text-red-100 border border-red-400/50 uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <AlertCircle className="h-3 w-3" /> Overdue
          </span>
        )}

        {isActive && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-100 border border-emerald-500/50 uppercase tracking-wider shadow-sm">
            ⚡ Active
          </span>
        )}

        {card.list?.title && (
          <span className="text-[11px] font-semibold text-white/80 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            {card.list.title}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((ct: any) => (
            <TagBadge key={ct.id || ct.tag?.id || ct.tagId} name={ct.tag?.name || ct.name} color={ct.tag?.color || ct.color} variant="timeline" />
          ))}
        </div>
      )}
    </>
  );
};

const TimelineAssignees = ({ cardId, assignments }: { cardId: string; assignments?: any[] }) => {
  const people = useCardAssignments(cardId, assignments || []);

  if (people.length === 0) return null;

  return (
    <div className="flex -space-x-2 overflow-hidden border border-white/10 rounded-full p-0.5 bg-black/20">
      {people.map((assignee) => (
        assignee.userImage ? (
          <Image
            key={assignee.id}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-black object-cover"
            src={assignee.userImage}
            alt={assignee.userName || "User avatar"}
            title={assignee.userName}
            width={32}
            height={32}
            unoptimized
          />
        ) : (
          <span
            key={assignee.id}
            title={assignee.userName}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-black bg-white/20 text-xs font-semibold text-white"
          >
            {(assignee.userName || "?").charAt(0)}
          </span>
        )
      ))}
    </div>
  );
};
