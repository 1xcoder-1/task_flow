"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCardModal } from "@/hooks/use-card-modal";
import type { CardWithList } from "@/types";
import type { CardAssignment } from "@prisma/client";
import { fetcher } from "@/lib/fetcher";
import { Pencil, Calendar, Paperclip, CheckCircle2, Circle, Plus, Send, MessageSquare, Trash2, LinkIcon, ImageIcon, X, Check, FileText, Download, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrganization } from "@clerk/nextjs";
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
import { createAssignment } from "@/actions/create-assignment";
import { deleteAssignment } from "@/actions/delete-assignment";
import { reorderSubtasks } from "@/actions/reorder-subtasks";
import { createTag } from "@/actions/create-tag";
import { toggleCardTag } from "@/actions/toggle-card-tag";
import { getTags } from "@/actions/get-tags";
import { TagBadge } from "@/components/tag-badge";
import { Tag as TagIcon, GripVertical, UploadCloud } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardAssignmentOverlay, useCardOverlayStore } from "@/hooks/use-card-assignment-overlay";
import { prepareUploadFile } from "@/lib/compress-media";

const HeaderSection = ({ title, onTitleChange, onTitleBlur, description, onDescriptionChange, onDescriptionBlur }: any) => (
  <div className="space-y-3">
    <input
      aria-label="Card Title"
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      onBlur={onTitleBlur}
      className="text-2xl font-bold text-gray-900 leading-tight w-full focus:outline-none focus:ring-1 focus:ring-gray-300 border border-gray-200 rounded-lg px-3 py-2 bg-transparent"
      placeholder="Card Title"
    />
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</div>
      <RichTextEditor
        value={description}
        onChange={(val) => onDescriptionChange(val)}
        onBlur={(val) => {
          onDescriptionChange(val);
          onDescriptionBlur(val);
        }}
        placeholder="Add a detailed description using bold, lists, formatting..."
      />
    </div>
  </div>
);

const MetadataSection = ({ cardData, priority, onPriorityChange, status, onStatusChange, onDueDateChange, memberships, isAssigneeOpen, setIsAssigneeOpen, onToggleAssignee, isTagOpen, setIsTagOpen, orgTags, newTagName, setNewTagName, newTagColor, setNewTagColor, onCreateNewTag, onToggleTag }: any) => (
  <div className="grid grid-cols-[100px_1fr] gap-y-4 text-sm items-center">
    <div className="text-gray-500">Priority</div>
    <div>
      <div className="relative inline-block">
        <select
          aria-label="Select priority"
          value={priority}
          onChange={onPriorityChange}
          className="appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 pl-3 pr-8 py-1.5 shadow-sm cursor-pointer"
        >
          <option value="Low">⚪ Low</option>
          <option value="Medium">🟠 Medium</option>
          <option value="High">🔴 High</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
      </div>
    </div>

    <div className="text-gray-500">Status</div>
    <div>
      <div className="relative inline-block">
        <select
          aria-label="Select status"
          value={status}
          onChange={onStatusChange}
          className="appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 pl-3 pr-8 py-1.5 shadow-sm cursor-pointer"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
      </div>
    </div>

    <div className="text-gray-500">Due date</div>
    <div className="flex items-center text-gray-700 font-medium text-sm gap-x-2">
      <input
        aria-label="Select due date"
        type="date"
        value={cardData?.dueDate ? (() => { const d = new Date(cardData.dueDate!); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : ""}
        onChange={(e) => onDueDateChange?.(e.target.value)}
        className="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 w-[140px] text-gray-700"
      />
    </div>

    <div className="text-gray-500">Assignees</div>
    <div className="flex items-center gap-x-2">
      <div className="flex -space-x-1">
        {cardData?.assignments && cardData.assignments.length > 0 ? cardData.assignments.map((assignee: any) => (
          <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white">
            <AvatarImage src={assignee.userImage} />
            <AvatarFallback>{assignee.userName.charAt(0)}</AvatarFallback>
          </Avatar>
        )) : null}
      </div>

      <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50">
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Assign members</div>
          <div className="space-y-1 max-h-52 overflow-y-auto custom-sidebar-scrollbar pr-1">
            {memberships?.data?.reduce((acc: any, mem: any) => {
              if (!mem.publicUserData) return acc;
              const isAssigned = cardData?.assignments?.some((a: any) => a.userId === mem.publicUserData!.userId);
              acc.push(
                <div
                  key={mem.publicUserData!.userId}
                  onClick={() => {
                    onToggleAssignee(mem.publicUserData!.userId!, mem.publicUserData!.firstName || "User", mem.publicUserData!.imageUrl || "");
                    setIsAssigneeOpen(false);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleAssignee(mem.publicUserData!.userId!, mem.publicUserData!.firstName || "User", mem.publicUserData!.imageUrl || "");
                      setIsAssigneeOpen(false);
                    }
                  }}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer transition"
                >
                  <div className="flex items-center gap-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={mem.publicUserData!.imageUrl} />
                      <AvatarFallback>{mem.publicUserData!.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">{mem.publicUserData!.firstName} {mem.publicUserData!.lastName}</span>
                  </div>
                  {isAssigned && <Check className="h-4 w-4 text-sky-600" />}
                </div>
              );
              return acc;
            }, [])}
            {(!memberships?.data || memberships.data.length === 0) && (
              <div className="text-xs text-gray-500 text-center py-2">No members found.</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>

    <div className="text-gray-500">Tags</div>
    <div className="flex items-center gap-x-2 flex-wrap gap-y-1">
      {cardData?.tags && cardData.tags.length > 0 ? (
        cardData.tags.map((ct: any) => (
          <TagBadge key={ct.id || ct.tag?.id} name={ct.tag?.name || ct.name} color={ct.tag?.color || ct.color} />
        ))
      ) : null}

      <Dialog open={isTagOpen} onOpenChange={setIsTagOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50">
            <Plus className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md p-5 bg-white border border-gray-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-800">Manage Card Tags</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-sidebar-scrollbar my-2 p-1">
            {orgTags.length === 0 ? (
              <div className="w-full text-xs text-gray-400 text-center py-4">No tags created yet.</div>
            ) : (
              orgTags.map((tag: any) => {
                const isAttached = cardData?.tags?.some((ct: any) => ct.tagId === tag.id || ct.tag?.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleTag(tag.id)}
                    className={`flex items-center gap-x-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer text-xs ${isAttached
                      ? "ring-2 ring-sky-500 ring-offset-1 font-semibold shadow-xs"
                      : "opacity-80 hover:opacity-100"
                      }`}
                    style={{
                      backgroundColor: `${tag.color}15`,
                      borderColor: `${tag.color}40`,
                      color: tag.color,
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="font-medium">{tag.name}</span>
                    {isAttached && <Check className="h-3.5 w-3.5 ml-1" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t pt-3 space-y-3">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Create New Tag</div>
            <div className="flex items-center gap-x-2">
              <input
                aria-label="Tag Name"
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <input
                aria-label="Tag Color"
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-9 h-9 p-1 border rounded-lg cursor-pointer shrink-0"
              />
            </div>
            <Button onClick={onCreateNewTag} size="sm" className="w-full h-9 text-xs rounded-lg font-medium">
              Create Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
);

const SubtasksSection = ({ cardData, subtaskTitle, setSubtaskTitle, onAddSubtask, onToggleSubtask, onDeleteSubtask, onReorderSubtasks }: any) => {
  const [subtasks, setSubtasks] = useState<any[]>(cardData?.subtasks || []);

  useEffect(() => {
    setSubtasks(cardData?.subtasks || []);
  }, [cardData?.subtasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(subtasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSubtasks(items);
    onReorderSubtasks(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <CheckCircle2 className="h-4 w-4 text-sky-500" />
          <h3 className="font-semibold text-gray-900">Subtasks</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-xs font-medium text-sky-700">
            {subtasks.length}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {subtasks.filter((s: any) => s.isCompleted).length} of {subtasks.length} done
        </span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="subtasks-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {subtasks.map((subtask: any, index: number) => (
                <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group flex items-center justify-between gap-x-2 p-2.5 rounded-lg border transition ${snapshot.isDragging
                          ? "bg-sky-50/90 border-sky-300 shadow-md scale-[1.01]"
                          : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>

                      <button
                        type="button"
                        className="flex items-center gap-x-3 flex-1 cursor-pointer text-left"
                        onClick={() => onToggleSubtask(subtask.id, subtask.isCompleted)}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 transition-colors ${subtask.isCompleted
                              ? "text-emerald-500 fill-emerald-50"
                              : "text-gray-300 group-hover:text-gray-400"
                            }`}
                        />
                        <span
                          className={`text-sm ${subtask.isCompleted
                              ? "text-gray-400 line-through"
                              : "text-gray-700 font-medium"
                            }`}
                        >
                          {subtask.title}
                        </span>
                      </button>

                      <Button
                        onClick={() => onDeleteSubtask(subtask.id)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex items-center gap-x-2 w-full mt-2">
        <input
          aria-label="Add a subtask"
          type="text"
          value={subtaskTitle}
          onChange={(e) => setSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAddSubtask();
          }}
          placeholder="Add a subtask..."
          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
        />
        <Button onClick={onAddSubtask} variant="outline" size="icon" className="h-9 w-9 rounded-lg">
          <Plus className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    </div>
  );
};

const handleDownload = (e: React.MouseEvent, url: string, filename?: string) => {
  e.preventDefault();
  e.stopPropagation();
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "attachment";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const handleView = (e: React.MouseEvent, url: string) => {
  e.preventDefault();
  if (url.startsWith('data:')) {
    const win = window.open();
    if (win) {
      win.document.write(`
        <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;height:100vh;">
          ${url.startsWith('data:image')
          ? `<img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;"/>`
          : `<iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>`
        }
        </body>
      `);
      win.document.close();
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const AttachmentsSection = ({ cardData, isAddingLink, setIsAddingLink, linkUrl, setLinkUrl, onSubmitLink, onImageUpload, fileInputRef, docInputRef, onDocumentUpload, onDeleteAttachment, onFileUpload }: any) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => onFileUpload(file));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-4 p-3 rounded-xl transition-all ${isDragOver ? "bg-sky-50 border-2 border-dashed border-sky-400 ring-2 ring-sky-200" : ""
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Paperclip className="h-4 w-4 text-sky-500" />
          <h3 className="font-semibold text-gray-900">Attachments</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-xs font-medium text-sky-700">
            {cardData?.attachments?.length || 0}
          </span>
        </div>
      </div>

      {/* Permanent Drag & Drop Upload Zone */}
      <div
        onClick={() => docInputRef.current?.click()}
        className={`py-5 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragOver
            ? "border-sky-500 bg-sky-100/70 ring-4 ring-sky-100 scale-[1.01]"
            : "border-neutral-200 hover:border-sky-400 bg-neutral-50/50 hover:bg-sky-50/40"
          }`}
      >
        <UploadCloud className={`w-8 h-8 mb-1.5 transition-colors ${isDragOver ? "text-sky-600 animate-bounce" : "text-neutral-400 group-hover:text-sky-500"}`} />
        <p className="text-xs font-semibold text-neutral-700">
          <span className="text-sky-600 underline underline-offset-2">Click to upload</span> or drag and drop files
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">Supports images, PDFs, documents, or text files</p>
      </div>

      <div className="space-y-3">
        {/* Images Grid (2 per row) */}
        {cardData?.attachments?.some((a: any) => a.type === "image" || a.url?.startsWith("data:image")) && (
          <div className="grid grid-cols-2 gap-2.5">
            {cardData.attachments
              .filter((a: any) => a.type === "image" || a.url?.startsWith("data:image"))
              .map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="group relative rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-900 aspect-video shadow-xs hover:shadow-md transition-all [content-visibility:auto]"
                >
                  <img
                    src={attachment.previewUrl || attachment.url}
                    alt={attachment.title || "Image attachment"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end justify-between">
                    <span className="text-[11px] font-medium text-white truncate max-w-[50%]">
                      {attachment.title || "Image"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, attachment.url, attachment.title || "image.png")}
                        className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white transition backdrop-blur-xs"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleView(e, attachment.url)}
                        className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white transition backdrop-blur-xs"
                        title="View Image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAttachment(attachment.id)}
                        className="p-1.5 rounded-md bg-red-500/80 hover:bg-red-600 text-white transition backdrop-blur-xs"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Non-Image Attachments (2 per row grid layout) */}
        {cardData?.attachments?.filter((a: any) => a.type !== "image" && !a.url?.startsWith("data:image")).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cardData.attachments
              .filter((a: any) => a.type !== "image" && !a.url?.startsWith("data:image"))
              .map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50/80 hover:border-sky-300 transition-all shadow-2xs min-w-0 [content-visibility:auto]"
                >
                  <a
                    href={attachment.url}
                    onClick={(e) => handleView(e, attachment.url)}
                    className="flex items-center gap-x-2 truncate text-xs font-semibold text-neutral-800 hover:text-sky-600 min-w-0 flex-1"
                  >
                    {attachment.type === "document" ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                        <LinkIcon className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="truncate min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-neutral-800">{attachment.title || attachment.url}</p>
                      <p className="text-[9px] text-neutral-400 font-normal uppercase">{attachment.type || "link"}</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-x-0.5 shrink-0 ml-1">
                    <Button
                      onClick={(e) => handleDownload(e, attachment.url, attachment.title)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={(e) => handleView(e, attachment.url)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-neutral-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                      title="Open Link"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => onDeleteAttachment(attachment.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {isAddingLink && (
        <div className="flex items-center gap-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <input
            aria-label="Link URL"
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmitLink(); }}
            placeholder="Paste URL here..."
            className="flex-1 text-sm px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
            autoFocus
          />
          <Button onClick={onSubmitLink} size="sm" className="h-8 rounded px-3">Add</Button>
          <Button onClick={() => setIsAddingLink(false)} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded text-gray-500">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-x-2 pt-2">
        <Button onClick={() => setIsAddingLink(!isAddingLink)} variant="outline" size="sm" className="h-8 rounded-lg text-xs font-medium px-3">
          <LinkIcon className="h-3 w-3 mr-1.5" />
          Link
        </Button>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onImageUpload}
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-8 rounded-lg text-xs font-medium px-3">
          <ImageIcon className="h-3 w-3 mr-1.5" />
          Image
        </Button>

        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          ref={docInputRef}
          onChange={onDocumentUpload}
        />
        <Button onClick={() => docInputRef.current?.click()} variant="outline" size="sm" className="h-8 rounded-lg text-xs font-medium px-3">
          <FileText className="h-3 w-3 mr-1.5" />
          Document
        </Button>
      </div>
    </div>
  );
};

const renderCommentText = (text: string) => {
  if (!text) return null;
  // Match @Word or @Name patterns
  const parts = text.split(/(@[A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/g);
  return (
    <span className="text-gray-700 font-normal">
      {parts.map((part, i) => {
        const key = `part-${part}-${i}`;
        if (part.startsWith("@") && part.trim().length > 1) {
          return (
            <span key={key} className="font-semibold text-sky-700 bg-sky-100/80 border border-sky-200/80 px-1.5 py-0.5 rounded-md text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};

const CommentsSection = ({ cardData, memberships, onAddCommentWithMentions, onDeleteComment }: any) => {
  const [commentText, setCommentText] = useState("");
  const mentionedUserIdsRef = useRef<string[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex === val.length - 1) {
      setShowMentionDropdown(true);
      setMentionFilter("");
    } else if (lastAtIndex !== -1 && !val.slice(lastAtIndex).includes(" ")) {
      setShowMentionDropdown(true);
      setMentionFilter(val.slice(lastAtIndex + 1).toLowerCase());
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMember = (userId: string, name: string) => {
    const lastAtIndex = commentText.lastIndexOf("@");
    const prefix = commentText.slice(0, lastAtIndex);
    const newText = `${prefix}@${name} `;
    setCommentText(newText);
    if (!mentionedUserIdsRef.current.includes(userId)) {
      mentionedUserIdsRef.current.push(userId);
    }
    setShowMentionDropdown(false);
  };

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    onAddCommentWithMentions(commentText, mentionedUserIdsRef.current);
    setCommentText("");
    mentionedUserIdsRef.current = [];
    setShowMentionDropdown(false);
  };

  const membersList = memberships?.data || [];
  const filteredMembers = membersList.filter((m: any) => {
    const fullName = `${m.publicUserData?.firstName || ""} ${m.publicUserData?.lastName || ""}`.toLowerCase();
    return fullName.includes(mentionFilter);
  });

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-x-2">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Comments</h3>
        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          {cardData?.comments?.length || 0}
        </span>
      </div>

      <div className="relative">
        <div className="flex items-center gap-x-2">
          <input
            aria-label="Write a comment (@ to mention)"
            type="text"
            value={commentText}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Write a comment (@ to mention team members)..."
            className="flex-1 text-sm px-4 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <Button onClick={handleSubmit} className="h-9 w-9 p-0 rounded-xl bg-gray-500 hover:bg-gray-600">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Floating @Mention Member Dropdown */}
        {showMentionDropdown && filteredMembers.length > 0 && (
          <div className="absolute left-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1.5 max-h-48 overflow-y-auto custom-sidebar-scrollbar">
            <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">Mention member</div>
            {filteredMembers.map((mem: any) => {
              if (!mem.publicUserData) return null;
              const name = `${mem.publicUserData.firstName || "User"} ${mem.publicUserData.lastName || ""}`.trim();
              return (
                <button
                  type="button"
                  key={mem.publicUserData.userId}
                  onClick={() => handleSelectMember(mem.publicUserData.userId!, name)}
                  className="flex w-full items-center gap-x-2 px-2 py-1.5 hover:bg-sky-50 rounded-lg text-left transition text-sm text-gray-700"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={mem.publicUserData.imageUrl} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs">{name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {cardData?.comments?.map((comment: any) => (
        <div key={comment.id} className="group flex items-start justify-between gap-x-3 pt-2">
          <div className="flex items-start gap-x-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={comment.userImage} />
              <AvatarFallback>{(comment.userName || "U").charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-x-2">
                <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                <span className="text-[11px] text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric", timeZone: "UTC" })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {renderCommentText(comment.text || (comment as any).content)}
              </p>
            </div>
          </div>
          <Button onClick={() => onDeleteComment(comment.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export const CardModal = () => {
  const queryClient = useQueryClient();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onOpen = useCardModal((state) => state.onOpen);
  const onClose = useCardModal((state) => state.onClose);

  const handleCloseModal = () => {
    onClose();
    if (searchParams?.get("cardId")) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("cardId");
      const query = newParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  useEffect(() => {
    const cardIdFromUrl = searchParams?.get("cardId");
    if (cardIdFromUrl) {
      onOpen(cardIdFromUrl);
    }
  }, [searchParams, onOpen]);

  const { data: cardData, isLoading } = useQuery<CardWithList>({
    queryKey: ["card", id],
    queryFn: () => fetcher(`/api/cards/${id}`),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const updateCardCache = useCallback((updater: (card: CardWithList) => CardWithList) => {
    if (!id) return;
    queryClient.setQueryData<CardWithList>(["card", id], (card) => card ? updater(card) : card);
  }, [id, queryClient]);

  const setCardAssignments = useCardAssignmentOverlay((state) => state.setCardAssignments);
  const patchCard = useCardOverlayStore((state) => state.patchCard);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");
  const [status, setStatus] = useState("PENDING");
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { data: orgTags = [] } = useQuery<any[]>({
    queryKey: ["org-tags"],
    queryFn: () => getTags(),
    enabled: isOpen,
    staleTime: 300_000,
  });

  const { execute: executeCreateTag } = useAction(createTag, {
    onSuccess: () => {
      toast.success("Tag created!");
      setNewTagName("");
      queryClient.invalidateQueries({ queryKey: ["org-tags"] });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeToggleCardTag } = useAction(toggleCardTag, {
    onSuccess: ({ tagId, attached }: any) => {
      let next: any[] = [];
      updateCardCache((card) => {
        const without = (card.tags || []).filter((cardTag: any) => cardTag.tagId !== tagId && cardTag.tag?.id !== tagId);
        next = attached
          ? [...without, { tagId, tag: orgTags.find((tag) => tag.id === tagId) }]
          : without;
        return { ...card, tags: next };
      });
      if (id) patchCard(id, { tags: next });
    },
    onError: (error) => {
      toast.error(error);
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
  });

  // Sync state when data loads
  useEffect(() => {
    if (cardData) {
      setTitle(cardData.title || "");
      setDescription(cardData.description || "");
      setPriority(cardData.priority || "Low");
      setStatus(cardData.status || "PENDING");
    }
  }, [cardData]);

  const { memberships } = useOrganization({ memberships: { pageSize: 50 } });

  // --- Actions ---
  const { execute: executeUpdateCard, isLoading: isUpdatingCard } = useAction(updateCard, {
    onSuccess: (updatedCard: any) => {
      toast.success("Card updated in real time!");
      updateCardCache((card) => ({ ...card, ...updatedCard }));
      if (id) {
        patchCard(id, {
          priority: updatedCard.priority,
          status: updatedCard.status,
          isActive: updatedCard.isActive,
          dueDate: updatedCard.dueDate ?? null,
          title: updatedCard.title,
          description: updatedCard.description,
        });
      }
    },
    onError: (error) => {
      toast.error(error);
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
  });

  const { execute: executeDeleteCard } = useAction(deleteCard, {
    onSuccess: () => {
      toast.success("Card deleted");
      onClose();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateSubtask } = useAction(createSubtask, {
    onSuccess: (subtask: any) => {
      toast.success("Subtask added");
      setSubtaskTitle("");
      updateCardCache((card) => ({ ...card, subtasks: [...(card.subtasks || []), subtask] }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdateSubtask } = useAction(updateSubtask, {
    onSuccess: (subtask: any) => {
      updateCardCache((card) => ({
        ...card,
        subtasks: (card.subtasks || []).map((item) => item.id === subtask.id ? subtask : item),
      }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteSubtask } = useAction(deleteSubtask, {
    onSuccess: (subtask: any) => {
      toast.success("Subtask deleted");
      updateCardCache((card) => ({ ...card, subtasks: (card.subtasks || []).filter((item) => item.id !== subtask.id) }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateComment } = useAction(createComment, {
    onSuccess: (comment: any) => {
      toast.success("Comment added");
      updateCardCache((card) => ({ ...card, comments: [comment, ...(card.comments || [])] }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteComment } = useAction(deleteComment, {
    onSuccess: (comment: any) => {
      toast.success("Comment deleted");
      updateCardCache((card) => ({ ...card, comments: (card.comments || []).filter((item) => item.id !== comment.id) }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateAttachment } = useAction(createAttachment, {
    onSuccess: (attachment: any) => {
      toast.success("Attachment added");
      updateCardCache((card) => ({ ...card, attachments: [attachment, ...(card.attachments || [])] }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteAttachment } = useAction(deleteAttachment, {
    onSuccess: (attachment: any) => {
      toast.success("Attachment deleted");
      updateCardCache((card) => ({ ...card, attachments: (card.attachments || []).filter((item) => item.id !== attachment.id) }));
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeCreateAssignment } = useAction(createAssignment, {
    onSuccess: (assignment: any) => {
      toast.success("Member assigned! They will be notified.");
      let next: any[] = [];
      updateCardCache((card) => {
        next = [
          ...(card.assignments || []).filter((item) => item.userId !== assignment.userId && item.id !== assignment.id),
          assignment,
        ];
        return { ...card, assignments: next };
      });
      if (id) setCardAssignments(id, next);
    },
    onError: (error) => {
      toast.error(error);
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
  });

  const { execute: executeDeleteAssignment } = useAction(deleteAssignment, {
    onSuccess: (assignment: any) => {
      toast.success("Member unassigned.");
      let next: any[] = [];
      updateCardCache((card) => {
        next = (card.assignments || []).filter((item) => item.id !== assignment.id);
        return { ...card, assignments: next };
      });
      if (id) setCardAssignments(id, next);
    },
    onError: (error) => {
      toast.error(error);
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
  });

  // --- Handlers ---
  const onTitleChange = (val: string) => {
    setTitle(val);
    if (cardData) patchCard(cardData.id, { title: val });
  };

  const onDescriptionChange = (val: string) => {
    setDescription(val);
    if (cardData) patchCard(cardData.id, { description: val });
  };

  const onTitleBlur = () => {
    if (!cardData || title === cardData.title) return;
    updateCardCache((card) => ({ ...card, title }));
    patchCard(cardData.id, { title });
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, title });
  };

  const onDescriptionBlur = (newDesc?: string) => {
    const finalDesc = newDesc !== undefined ? newDesc : description;
    if (!cardData || finalDesc === cardData.description) return;
    updateCardCache((card) => ({ ...card, description: finalDesc }));
    patchCard(cardData.id, { description: finalDesc });
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, description: finalDesc });
  };

  const onPriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!cardData) return;
    const val = e.target.value;
    setPriority(val);
    updateCardCache((card) => ({ ...card, priority: val }));
    patchCard(cardData.id, { priority: val });
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, priority: val });
  };

  const onStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!cardData) return;
    const val = e.target.value;
    const isActive = val === "IN_PROGRESS";
    setStatus(val);
    updateCardCache((card) => ({ ...card, status: val, isActive }));
    patchCard(cardData.id, { status: val, isActive });
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, status: val });
  };

  const onDueDateChange = (val: string) => {
    if (!cardData) return;
    const dueDate = val ? new Date(`${val}T00:00:00`) : null;
    updateCardCache((card) => ({ ...card, dueDate: dueDate as any }));
    patchCard(cardData.id, { dueDate });
    executeUpdateCard({
      id: cardData.id,
      boardId: params.boardId as string,
      dueDate,
    });
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

  const { execute: executeReorderSubtasks } = useAction(reorderSubtasks, {
    onSuccess: (data: any) => {
      updateCardCache((card) => ({ ...card, subtasks: data }));
    },
    onError: (error) => toast.error(error),
  });

  const onReorderSubtasks = (items: any[]) => {
    if (!cardData) return;
    executeReorderSubtasks({ cardId: cardData.id, items });
  };

  const onFileUpload = (file: File) => {
    uploadAttachmentFile(file);
  };

  const onDeleteComment = (commentId: string) => {
    executeDeleteComment({ id: commentId, boardId: params.boardId as string });
  };

  const onSubmitLink = () => {
    if (!linkUrl || !cardData) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    executeCreateAttachment({ url, type: "link", title: url.split('/').pop() || "Link", cardId: cardData.id, boardId: params.boardId as string });
    setLinkUrl("");
    setIsAddingLink(false);
  };

  const uploadAttachmentFile = async (file: File) => {
    if (!file || !cardData) return;

    const toastId = toast.loading("Compressing and uploading...");
    const tempId = `upload-${Date.now()}`;

    try {
      const prepared = await prepareUploadFile(file);
      updateCardCache((card) => ({
        ...card,
        attachments: [
          {
            id: tempId,
            url: prepared.previewUrl || "",
            previewUrl: prepared.previewUrl,
            type: prepared.type,
            title: file.name,
            cardId: cardData.id,
          } as any,
          ...(card.attachments || []),
        ],
      }));

      const form = new FormData();
      form.append("file", new File([prepared.blob], prepared.name, { type: prepared.mimeType }));
      form.append("cardId", cardData.id);
      form.append("boardId", params.boardId as string);
      form.append("type", prepared.type);
      form.append("title", file.name);
      if (prepared.previewUrl) form.append("previewUrl", prepared.previewUrl);

      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: form,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Upload failed");
      }

      updateCardCache((card) => ({
        ...card,
        attachments: [
          json,
          ...(card.attachments || []).filter((item) => item.id !== tempId && item.id !== json.id),
        ],
      }));
      toast.success("Attachment added", { id: toastId });
    } catch (error: any) {
      updateCardCache((card) => ({
        ...card,
        attachments: (card.attachments || []).filter((item) => item.id !== tempId),
      }));
      toast.error(error?.message || "Upload failed", { id: toastId });
    }
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAttachmentFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAttachmentFile(file);
    if (docInputRef.current) docInputRef.current.value = "";
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

  const onToggleAssignee = (userId: string, userName: string, userImage: string) => {
    if (!cardData) return;
    const current = cardData.assignments || [];
    const existing = current.find((a) => a.userId === userId);

    if (existing) {
      const next = current.filter((a) => a.id !== existing.id);
      updateCardCache((card) => ({ ...card, assignments: next }));
      setCardAssignments(cardData.id, next);
      executeDeleteAssignment({ id: existing.id, boardId: params.boardId as string });
      return;
    }

    const optimistic: CardAssignment = {
      id: `opt-${userId}`,
      userId,
      userName,
      userImage,
      cardId: cardData.id,
      createdAt: new Date(),
    };
    const next: CardAssignment[] = [...current, optimistic];
    updateCardCache((card) => ({ ...card, assignments: next }));
    setCardAssignments(cardData.id, next);
    executeCreateAssignment({
      userId,
      userName,
      userImage,
      cardId: cardData.id,
      boardId: params.boardId as string,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleCloseModal}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[460px] p-0 overflow-hidden flex flex-col bg-white border-l shadow-2xl"
      >
        <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <SheetTitle className="text-sm font-semibold text-gray-800">Task Detail</SheetTitle>
          <div className="flex items-center gap-x-2">
            {cardData && (
              <Button onClick={onDeleteCard} variant="ghost" size="icon" className="h-8 w-8 rounded-full border text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {isLoading || !cardData ? (
          <div className="flex-1 p-6 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain custom-sidebar-scrollbar p-6 space-y-8">
            <HeaderSection
              title={title}
              onTitleChange={onTitleChange}
              onTitleBlur={onTitleBlur}
              description={description}
              onDescriptionChange={onDescriptionChange}
              onDescriptionBlur={onDescriptionBlur}
            />
            <MetadataSection
              cardData={cardData}
              priority={priority}
              onPriorityChange={onPriorityChange}
              status={status}
              onStatusChange={onStatusChange}
              onDueDateChange={onDueDateChange}
              memberships={memberships}
              isAssigneeOpen={isAssigneeOpen}
              setIsAssigneeOpen={setIsAssigneeOpen}
              onToggleAssignee={onToggleAssignee}
              isTagOpen={isTagOpen}
              setIsTagOpen={setIsTagOpen}
              orgTags={orgTags}
              newTagName={newTagName}
              setNewTagName={setNewTagName}
              newTagColor={newTagColor}
              setNewTagColor={setNewTagColor}
              onCreateNewTag={() => {
                if (!newTagName.trim()) return;
                executeCreateTag({ name: newTagName, color: newTagColor });
              }}
              onToggleTag={(tagId: string) => {
                if (!cardData) return;
                const current = cardData.tags || [];
                const isAttached = current.some((ct: any) => ct.tagId === tagId || ct.tag?.id === tagId);
                const next = isAttached
                  ? current.filter((ct: any) => ct.tagId !== tagId && ct.tag?.id !== tagId)
                  : [...current, { tagId, tag: orgTags.find((tag: any) => tag.id === tagId) }];
                updateCardCache((card) => ({ ...card, tags: next }));
                patchCard(cardData.id, { tags: next });
                executeToggleCardTag({ cardId: cardData.id, tagId, boardId: params.boardId as string });
              }}
            />
            <div className="w-full h-px bg-gray-100" />
            <SubtasksSection
              cardData={cardData}
              subtaskTitle={subtaskTitle}
              setSubtaskTitle={setSubtaskTitle}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onReorderSubtasks={onReorderSubtasks}
            />
            <div className="w-full h-px bg-gray-100" />
            <AttachmentsSection
              cardData={cardData}
              isAddingLink={isAddingLink}
              setIsAddingLink={setIsAddingLink}
              linkUrl={linkUrl}
              setLinkUrl={setLinkUrl}
              onSubmitLink={onSubmitLink}
              onImageUpload={onImageUpload}
              fileInputRef={fileInputRef}
              docInputRef={docInputRef}
              onDocumentUpload={onDocumentUpload}
              onDeleteAttachment={onDeleteAttachment}
              onFileUpload={onFileUpload}
            />
            <div className="w-full h-px bg-gray-100" />
            <CommentsSection
              cardData={cardData}
              memberships={memberships}
              onAddCommentWithMentions={(text: string, mentionedUserIds: string[]) => {
                if (!text.trim() || !cardData) return;
                executeCreateComment({
                  text,
                  cardId: cardData.id,
                  boardId: params.boardId as string,
                  mentionedUserIds,
                });
              }}
              onDeleteComment={onDeleteComment}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
