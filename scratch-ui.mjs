import fs from 'fs';
import path from 'path';

const newCode = \"use client";

import { useState, useRef, ElementRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCardModal } from "@/hooks/use-card-modal";
import type { CardWithList } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { Pencil, Calendar, Paperclip, CheckCircle2, Circle, Plus, Send, MessageSquare, Trash2, LinkIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { deleteCard } from "@/actions/delete-card";
import { createSubtask } from "@/actions/create-subtask";
import { updateSubtask } from "@/actions/update-subtask";
import { deleteSubtask } from "@/actions/delete-subtask";
import { createComment } from "@/actions/create-comment";
import { deleteComment } from "@/actions/delete-comment";
import { createAttachment } from "@/actions/create-attachment";
import { deleteAttachment } from "@/actions/delete-attachment";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export const CardModal = () => {
  const queryClient = useQueryClient();
  const params = useParams();
  
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id],
    queryFn: () => fetcher(\\\/api/cards/\\\\),
    enabled: !!id,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");

  // Sync state when data loads
  if (cardData && !title && cardData.title !== title) {
    setTitle(cardData.title);
    setDescription(cardData.description || "");
  }

  // --- Actions ---
  const { execute: executeUpdateCard } = useAction(updateCard, {
    onSuccess: () => {
      toast.success("Card updated");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
      queryClient.invalidateQueries({ queryKey: ["org-stats"] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteCard } = useAction(deleteCard, {
    onSuccess: () => {
      toast.success("Card deleted");
      onClose();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateSubtask } = useAction(createSubtask, {
    onSuccess: () => {
      toast.success("Subtask added");
      setSubtaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdateSubtask } = useAction(updateSubtask, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteSubtask } = useAction(deleteSubtask, {
    onSuccess: () => {
      toast.success("Subtask deleted");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateComment } = useAction(createComment, {
    onSuccess: () => {
      toast.success("Comment added");
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteComment } = useAction(deleteComment, {
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateAttachment } = useAction(createAttachment, {
    onSuccess: () => {
      toast.success("Attachment added");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteAttachment } = useAction(deleteAttachment, {
    onSuccess: () => {
      toast.success("Attachment deleted");
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
    onError: (error) => toast.error(error),
  });

  // --- Handlers ---
  const onTitleBlur = () => {
    if (title === cardData?.title) return;
    executeUpdateCard({ id: cardData!.id, boardId: params.boardId as string, title });
  };

  const onDescriptionBlur = () => {
    if (description === cardData?.description) return;
    executeUpdateCard({ id: cardData!.id, boardId: params.boardId as string, description });
  };

  const onPriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!cardData) return;
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, priority: e.target.value });
  };

  const onAddSubtask = () => {
    if (!subtaskTitle.trim() || !cardData) return;
    executeCreateSubtask({ title: subtaskTitle, cardId: cardData.id, boardId: params.boardId as string });
  };

  const onToggleSubtask = (subtaskId: string, currentStatus: boolean) => {
    executeUpdateSubtask({ id: subtaskId, boardId: params.boardId as string, isCompleted: !currentStatus });
  };

  const onDeleteSubtask = (subtaskId: string) => {
    executeDeleteSubtask({ id: subtaskId, boardId: params.boardId as string });
  };

  const onAddComment = () => {
    if (!commentText.trim() || !cardData) return;
    executeCreateComment({ text: commentText, cardId: cardData.id, boardId: params.boardId as string });
  };

  const onDeleteComment = (commentId: string) => {
    executeDeleteComment({ id: commentId, boardId: params.boardId as string });
  };

  const onAddAttachment = () => {
    const url = prompt("Enter attachment URL (e.g., https://example.com/file.pdf):");
    if (!url || !cardData) return;
    executeCreateAttachment({ url, type: "link", title: url.split('/').pop() || "Attachment", cardId: cardData.id, boardId: params.boardId as string });
  };

  const onDeleteAttachment = (attachmentId: string) => {
    executeDeleteAttachment({ id: attachmentId, boardId: params.boardId as string });
  };

  const onDeleteCard = () => {
    if (!cardData) return;
    if (confirm("Are you sure you want to delete this card?")) {
      executeDeleteCard({ id: cardData.id, boardId: params.boardId as string });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] sm:max-w-md p-0 overflow-hidden flex flex-col bg-white">
        <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <SheetTitle className="text-sm font-semibold text-gray-800">Task Detail</SheetTitle>
          <div className="flex items-center gap-x-2">
            <Button onClick={onDeleteCard} variant="ghost" size="icon" className="h-8 w-8 rounded-full border text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={onTitleBlur}
              className="text-2xl font-bold text-gray-900 leading-tight w-full focus:outline-none focus:ring-1 focus:ring-gray-300 rounded px-1 -ml-1 bg-transparent"
              placeholder="Card Title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={onDescriptionBlur}
              className="text-sm text-gray-500 w-full resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 rounded px-1 -ml-1 bg-transparent min-h-[60px]"
              placeholder="Add a more detailed description..."
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-[100px_1fr] gap-y-4 text-sm items-center">
            <div className="text-gray-500">Status</div>
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-gray-200 text-gray-700 bg-white shadow-sm text-xs font-medium">
                {cardData?.list.title || "Loading..."} <span className="ml-2 text-gray-400">v</span>
              </span>
            </div>

            <div className="text-gray-500">Priority</div>
            <div>
              <div className="relative inline-block">
                <span className={\bsolute left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full \\} />
                <select 
                  value={cardData?.priority || "Low"}
                  onChange={onPriorityChange}
                  className="appearance-none bg-gray-50 border border-gray-100 text-gray-700 text-xs font-medium rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300 pl-6 pr-8 py-1 shadow-sm cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div className="text-gray-500">Due date</div>
            <div className="flex items-center text-gray-700 font-medium text-sm gap-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              {cardData?.dueDate ? new Date(cardData.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None"}
            </div>

            <div className="text-gray-500">Assignees</div>
            <div className="flex items-center gap-x-2">
              <div className="flex -space-x-1">
                {cardData?.assignments && cardData.assignments.length > 0 ? cardData.assignments.map((assignee) => (
                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={assignee.userImage} />
                    <AvatarFallback>{assignee.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )) : <span className="text-gray-500 text-sm">None</span>}
              </div>
              <span className="text-gray-600 text-sm">
                {cardData?.assignments?.map(a => a.userName).join(", ")}
              </span>
            </div>

            <div className="text-gray-500">Progress</div>
            <div className="flex items-center gap-x-3 w-full">
              <Progress value={cardData?.progress || 0} className="h-1.5 flex-1 bg-gray-100" />
              <span className="text-xs text-gray-500 font-medium">{cardData?.progress || 0}%</span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Subtasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <CheckCircle2 className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Subtasks</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {cardData?.subtasks?.length || 0}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {cardData?.subtasks?.filter(s => s.isCompleted).length || 0} of {cardData?.subtasks?.length || 0} done
              </span>
            </div>

            <div className="space-y-2">
              {cardData?.subtasks?.map((subtask) => (
                <div key={subtask.id} className="group flex items-center justify-between gap-x-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-x-3 flex-1 cursor-pointer" onClick={() => onToggleSubtask(subtask.id, subtask.isCompleted)}>
                    <CheckCircle2 className={\h-4 w-4 \\} />
                    <span className={\	ext-sm \\}>{subtask.title}</span>
                  </div>
                  <Button onClick={() => onDeleteSubtask(subtask.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-x-2 w-full mt-2">
                <input 
                  type="text" 
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onAddSubtask(); }}
                  placeholder="Add a subtask..." 
                  className="flex-1 text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <Button onClick={onAddSubtask} variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                  <Plus className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Attachments Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Attachments</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {cardData?.attachments?.length || 0}
                </span>
              </div>
              <Button onClick={onAddAttachment} variant="outline" size="sm" className="h-8 rounded-lg text-xs font-medium px-3">
                <Plus className="h-3 w-3 mr-1.5" />
                Add link
              </Button>
            </div>

            {cardData?.attachments?.map((attachment) => (
              <div key={attachment.id} className="group flex items-start justify-between gap-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                <div className="flex items-start gap-x-3">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-600 hover:underline line-clamp-1">{attachment.title || attachment.url}</a>
                    <span className="text-xs text-gray-500 mt-0.5">Link</span>
                  </div>
                </div>
                <Button onClick={() => onDeleteAttachment(attachment.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Comments Section */}
          <div className="space-y-4 pb-10">
            <div className="flex items-center gap-x-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Comments</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {cardData?.comments?.length || 0}
              </span>
            </div>

            <div className="flex items-center gap-x-2">
              <input 
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onAddComment(); }}
                placeholder="Write a comment..." 
                className="flex-1 text-sm px-4 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <Button onClick={onAddComment} className="h-9 w-9 p-0 rounded-xl bg-gray-500 hover:bg-gray-600">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {cardData?.comments?.map((comment) => (
              <div key={comment.id} className="group flex items-start justify-between gap-x-3 pt-2">
                <div className="flex items-start gap-x-3">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={comment.userImage} />
                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-x-2">
                      <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {comment.text || (comment as any).content}
                    </p>
                  </div>
                </div>
                <Button onClick={() => onDeleteComment(comment.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
};
\

fs.writeFileSync(path.join('components', 'modals', 'card-modal', 'index.tsx'), newCode);
