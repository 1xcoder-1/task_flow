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
  
  const cardData = data as CardWithRelations & { progress?: number, priority?: string, isActive?: boolean };

  const { execute } = useAction(updateCard, {
    onError: (error) => toast.error(error),
  });

  const onToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    execute({
      id: data.id,
      boardId: window.location.pathname.match(/\/board\/([^\/]+)/)?.[1] || "",
      isActive: !cardData.isActive,
    });
  };


  const attachmentsCount = cardData.attachments?.length || 0;
  const commentsCount = cardData.comments?.length || 0;
  const assignments = cardData.assignments || [];

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="button"
          onClick={() => cardModal.onOpen(data.id)}
          className="group relative flex flex-col gap-y-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3.5 shadow-sm transition"
        >
          {/* Card Title & Description */}
          <div className="flex flex-col gap-1.5 text-black">
            <div className="flex items-start gap-x-2">
              <div className="relative z-20 flex shrink-0 mt-0.5">
                <input
                  aria-label="Toggle card active status"
                  type="checkbox"
                  checked={cardData.isActive || false}
                  readOnly
                  onClick={onToggleActive}
                  className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </div>
              <h3 className="font-semibold text-[15px] leading-tight">
                {data.title}
              </h3>
            </div>
            {data.description && (
               <p className="text-[13px] text-gray-500 line-clamp-2 leading-snug">
                {data.description}
              </p>
            )}
          </div>

          {/* Avatars & Progress */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex -space-x-1.5 overflow-hidden">
              {assignments.map((assignment) => (
                <Image 
                  key={assignment.id}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white" 
                  src={assignment.userImage} 
                  alt={assignment.userName} 
                  title={assignment.userName}
                  width={24}
                  height={24}
                />
              ))}
            </div>

          </div>

          {/* Footer stats: Priority, Date, Attachments, Comments */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
            <div className="flex items-center gap-x-2">
              <span className="flex items-center gap-x-1.5 text-[11px] font-semibold text-black px-2 py-1 bg-gray-50 rounded-full border border-gray-200/60">
                {getPriorityDisplay(cardData.priority)}
              </span>
              {cardData.dueDate && (
                <span className="flex items-center gap-x-1 text-[11px] font-semibold text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(cardData.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
