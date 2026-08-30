"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCardModal } from "@/hooks/use-card-modal";
import type { CardWithList } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { Pencil, Calendar, Paperclip, CheckCircle2, Circle, Plus, Send, MessageSquare, Trash2, LinkIcon, ImageIcon, X, Check, FileText, Download, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Image from "next/image";

const HeaderSection = ({ title, setTitle, onTitleBlur, description, setDescription, onDescriptionBlur }: any) => (
  <div className="space-y-3">
    <input
      aria-label="Card Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={onTitleBlur}
      className="text-2xl font-bold text-gray-900 leading-tight w-full focus:outline-none focus:ring-1 focus:ring-gray-300 border border-gray-200 rounded-lg px-3 py-2 bg-transparent"
      placeholder="Card Title"
    />
    <textarea
      aria-label="Card Description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      onBlur={onDescriptionBlur}
      className="text-sm text-gray-700 w-full resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 border border-gray-200 rounded-lg px-3 py-2 bg-transparent min-h-[80px]"
      placeholder="Add a more detailed description..."
    />
  </div>
);

const MetadataSection = ({ cardData, priority, onPriorityChange, executeUpdateCard, params, memberships, isAssigneeOpen, setIsAssigneeOpen, onToggleAssignee }: any) => (
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
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>

    <div className="text-gray-500">Due date</div>
    <div className="flex items-center text-gray-700 font-medium text-sm gap-x-2">
      <input 
        aria-label="Select due date"
        type="date"
        value={cardData?.dueDate ? new Date(cardData.dueDate).toISOString().split('T')[0] : ""}
        onChange={(e) => {
          const val = e.target.value;
          if (!cardData) return;
          executeUpdateCard({ 
            id: cardData.id, 
            boardId: params.boardId as string, 
            dueDate: val ? new Date(val) : null 
          });
        }}
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
          <div className="space-y-1">
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
  </div>
);

const SubtasksSection = ({ cardData, subtaskTitle, setSubtaskTitle, onAddSubtask, onToggleSubtask, onDeleteSubtask }: any) => (
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
        {cardData?.subtasks?.filter((s: any) => s.isCompleted).length || 0} of {cardData?.subtasks?.length || 0} done
      </span>
    </div>

    <div className="space-y-2">
      {cardData?.subtasks?.map((subtask: any) => (
        <div key={subtask.id} className="group flex items-center justify-between gap-x-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
          <button type="button" className="flex items-center gap-x-3 flex-1 cursor-pointer text-left" onClick={() => onToggleSubtask(subtask.id, subtask.isCompleted)}>
            <CheckCircle2 className={`h-4 w-4 ${subtask.isCompleted ? 'text-green-500 fill-green-50' : 'text-gray-300'}`} />
            <span className={`text-sm ${subtask.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{subtask.title}</span>
          </button>
          <Button onClick={() => onDeleteSubtask(subtask.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-x-2 w-full mt-2">
        <input 
          aria-label="Add a subtask"
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
);

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

const AttachmentsSection = ({ cardData, isAddingLink, setIsAddingLink, linkUrl, setLinkUrl, onSubmitLink, onImageUpload, fileInputRef, docInputRef, onDocumentUpload, onDeleteAttachment }: any) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-2">
        <Paperclip className="h-4 w-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Attachments</h3>
        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          {cardData?.attachments?.length || 0}
        </span>
      </div>
    </div>

    {cardData?.attachments?.map((attachment: any) => (
      <div key={attachment.id} className="group flex items-start justify-between gap-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
        <div className="flex items-start gap-x-3">
          {attachment.type === "image" ? (
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 relative">
              <Image src={attachment.url} alt="Attachment" fill sizes="40px" className="object-cover" />
            </div>
          ) : attachment.type === "document" ? (
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          ) : (
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <LinkIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="flex flex-col">
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-600 hover:underline line-clamp-1">{attachment.title || attachment.url}</a>
            <span className="text-xs text-gray-500 mt-0.5">{attachment.type === "image" ? "Image" : attachment.type === "document" ? "Document" : "Link"}</span>
            {(attachment.type === "image" || attachment.type === "document") && (
              <div className="flex items-center gap-x-3 mt-1.5">
                {attachment.type === "image" && (
                  <button type="button" onClick={(e) => handleView(e, attachment.url)} className="text-[10px] font-medium flex items-center text-gray-500 hover:text-gray-900 transition">
                    <ExternalLink className="h-3 w-3 mr-1" /> View
                  </button>
                )}
                <a href={attachment.url} download={attachment.title || "file"} className="text-[10px] font-medium flex items-center text-gray-500 hover:text-gray-900 transition">
                  <Download className="h-3 w-3 mr-1" /> Download
                </a>
              </div>
            )}
          </div>
        </div>
        <Button onClick={() => onDeleteAttachment(attachment.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-red-500">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    ))}

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

const CommentsSection = ({ cardData, commentText, setCommentText, onAddComment, onDeleteComment }: any) => (
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
        aria-label="Write a comment"
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

    {cardData?.comments?.map((comment: any) => (
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
                {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric", timeZone: "UTC" })}
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
);

export const CardModal = () => {
  const queryClient = useQueryClient();
  const params = useParams();
  
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id],
    queryFn: () => fetcher(`/api/cards/${id}`),
    enabled: !!id,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Sync state when data loads
  useEffect(() => {
    if (cardData) {
      setTitle(cardData.title || "");
      setDescription(cardData.description || "");
      setPriority(cardData.priority || "Low");
    }
  }, [cardData]);

  const { memberships } = useOrganization({ memberships: { pageSize: 10 } });

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

  const { execute: executeCreateAssignment } = useAction(createAssignment, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["card", id] }),
    onError: (error) => toast.error(error),
  });

  const { execute: executeDeleteAssignment } = useAction(deleteAssignment, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["card", id] }),
    onError: (error) => toast.error(error),
  });

  // --- Handlers ---
  const onTitleBlur = () => {
    if (!cardData || title === cardData.title) return;
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, title });
  };

  const onDescriptionBlur = () => {
    if (!cardData || description === cardData.description) return;
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, description });
  };

  const onPriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!cardData) return;
    const val = e.target.value;
    setPriority(val);
    executeUpdateCard({ id: cardData.id, boardId: params.boardId as string, priority: val });
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

  const onSubmitLink = () => {
    if (!linkUrl || !cardData) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    executeCreateAttachment({ url, type: "link", title: url.split('/').pop() || "Link", cardId: cardData.id, boardId: params.boardId as string });
    setLinkUrl("");
    setIsAddingLink(false);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cardData) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      executeCreateAttachment({ url: base64, type: "image", title: file.name, cardId: cardData.id, boardId: params.boardId as string });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cardData) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      executeCreateAttachment({ url: base64, type: "document", title: file.name, cardId: cardData.id, boardId: params.boardId as string });
    };
    reader.readAsDataURL(file);
    
    if (docInputRef.current) {
      docInputRef.current.value = "";
    }
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
    const existing = cardData.assignments?.find(a => a.userId === userId);
    if (existing) {
      executeDeleteAssignment({ id: existing.id, boardId: params.boardId as string });
    } else {
      executeCreateAssignment({
        userId,
        userName,
        userImage,
        cardId: cardData.id,
        boardId: params.boardId as string,
      });
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
          <HeaderSection
            title={title}
            setTitle={setTitle}
            onTitleBlur={onTitleBlur}
            description={description}
            setDescription={setDescription}
            onDescriptionBlur={onDescriptionBlur}
          />
          <MetadataSection
            cardData={cardData}
            priority={priority}
            onPriorityChange={onPriorityChange}
            executeUpdateCard={executeUpdateCard}
            params={params}
            memberships={memberships}
            isAssigneeOpen={isAssigneeOpen}
            setIsAssigneeOpen={setIsAssigneeOpen}
            onToggleAssignee={onToggleAssignee}
          />
          <div className="w-full h-px bg-gray-100" />
          <SubtasksSection
            cardData={cardData}
            subtaskTitle={subtaskTitle}
            setSubtaskTitle={setSubtaskTitle}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
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
          />
          <div className="w-full h-px bg-gray-100" />
          <CommentsSection
            cardData={cardData}
            commentText={commentText}
            setCommentText={setCommentText}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
