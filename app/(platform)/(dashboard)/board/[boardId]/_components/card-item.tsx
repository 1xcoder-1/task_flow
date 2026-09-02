"use client";

import { Card } from "@prisma/client";
import { Draggable } from "@hello-pangea/dnd";
import { useCardModal } from "@/hooks/use-card-modal";
import { Calendar, Paperclip, MessageSquare } from "lucide-react";
import Image from "next/image";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { toast } from "sonner";
import type { CardWithRelations } from "@/types";
import { TagBadge } from "@/components/tag-badge";
import { useCardOverlayStore } from "@/hooks/use-card-assignment-overlay";

type CardItemProps = {
  data: CardWithRelations;
  index: number;
};

const getPriorityDisplay = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case "high": return "🔴 High";
    case "medium": return "🟠 Medium";
    case "low": return "⚪ Low";
    default: return "⚪ Low";
  }
};

export const CardItem = ({ data, index }: CardItemProps) => {
  const cardModal = useCardModal();

  const cardData = data as any;

  const overlay = useCardOverlayStore((state) => state.byCardId[data.id]);
  const patchCard = useCardOverlayStore((state) => state.patchCard);
  const assignments = overlay?.assignments ?? cardData.assignments ?? [];
  const tags = overlay?.tags ?? cardData.tags ?? [];
  const status = overlay?.status ?? cardData.status;
  const priority = overlay?.priority ?? cardData.priority;
  const isActive = overlay?.isActive ?? cardData.isActive;
  const dueDate = overlay?.dueDate !== undefined ? overlay.dueDate : cardData.dueDate;
  const title = overlay?.title ?? data.title;
  const description = overlay?.description !== undefined ? overlay.description : data.description;

  const { execute } = useAction(updateCard, {
    onError: (error) => toast.error(error),
  });

  const onToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextActive = !isActive;
    patchCard(data.id, { isActive: nextActive });
    execute({
      id: data.id,
      boardId: window.location.pathname.match(/\/board\/([^\/]+)/)?.[1] || "",
      isActive: nextActive,
    });
  };

  const attachmentsCount = cardData._count?.attachments ?? cardData.attachments?.length ?? 0;
  const commentsCount = cardData._count?.comments ?? cardData.comments?.length ?? 0;

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="button"
          onClick={() => cardModal.onOpen(data.id)}
          className={`group relative flex flex-col gap-y-3 border rounded-xl p-3.5 shadow-sm transition overflow-hidden min-w-0 ${status === "DONE" ? "bg-emerald-50/50 border-emerald-100 opacity-80" : "bg-white border-gray-200 hover:border-gray-300"}`}
        >
          {/* Card Title & Description */}
          <div className="flex flex-col gap-1.5 text-black min-w-0">
            <div className="flex items-start gap-x-2 min-w-0">
              {status !== "DONE" && (
                <div className="relative z-20 flex shrink-0 mt-0.5">
                  <input
                    aria-label="Toggle card active status"
                    type="checkbox"
                    checked={isActive || false}
                    readOnly
                    onClick={onToggleActive}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
              )}
              <h3 className={`font-semibold text-[15px] leading-snug min-w-0 flex-1 break-words [overflow-wrap:anywhere] line-clamp-3 ${status === "DONE" ? "line-through text-gray-500" : ""}`}>
                {title}
              </h3>
            </div>
            {description && (
              <p className="text-[13px] text-gray-500 leading-snug min-w-0 break-words [overflow-wrap:anywhere] line-clamp-3 overflow-hidden">
                {description.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim()}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((ct: any) => (
                  <TagBadge key={ct.id || ct.tag?.id || ct.tagId} name={ct.tag?.name || ct.name} color={ct.tag?.color || ct.color} />
                ))}
              </div>
            )}
          </div>

          {/* Avatars & Progress */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex -space-x-1.5 overflow-hidden">
              {assignments.map((assignment: any) => (
                assignment.userImage ? (
                  <Image
                    key={assignment.id}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                    src={assignment.userImage}
                    alt={assignment.userName || "User avatar"}
                    title={assignment.userName}
                    width={24}
                    height={24}
                    unoptimized
                  />
                ) : (
                  <span
                    key={assignment.id}
                    title={assignment.userName}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white bg-sky-100 text-[10px] font-semibold text-sky-700"
                  >
                    {(assignment.userName || "?").charAt(0)}
                  </span>
                )
              ))}
            </div>

          </div>

          {/* Footer stats: Priority, Date, Attachments, Comments */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
            <div className="flex items-center gap-x-2">
              <span className="flex items-center gap-x-1.5 text-[11px] font-semibold text-black px-2 py-1 bg-gray-50 rounded-full border border-gray-200/60">
                {getPriorityDisplay(priority)}
              </span>
              {dueDate && (
                <span className="flex items-center gap-x-1 text-[11px] font-semibold text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-x-3 text-gray-400 text-[11px] font-semibold">
              {attachmentsCount > 0 && (
                <span className="flex items-center gap-x-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachmentsCount}
                </span>
              )}
              {commentsCount > 0 && (
                <span className="flex items-center gap-x-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {commentsCount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
