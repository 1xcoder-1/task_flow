"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  Folder,
  Layout,
  ListOrdered,
  CreditCard,
  Search,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrashedItems } from "@/actions/get-trashed-items";
import { restoreItem } from "@/actions/restore-item";
import { deletePermanently } from "@/actions/delete-permanently";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "all" | "folders" | "boards" | "lists" | "cards";

export const TrashModal = ({ isOpen, onClose }: TrashModalProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["trashed-items"],
    queryFn: async () => {
      const res = await getTrashedItems();
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled: isOpen,
  });

  const { execute: executeRestore, isLoading: isRestoring } = useAction(restoreItem, {
    onSuccess: () => {
      toast.success("Item restored successfully");
      queryClient.invalidateQueries({ queryKey: ["trashed-items"] });
      refetch();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deletePermanently, {
    onSuccess: () => {
      toast.success("Item deleted permanently");
      queryClient.invalidateQueries({ queryKey: ["trashed-items"] });
      refetch();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleEmptyTrash = () => {
    if (window.confirm("Are you sure you want to permanently delete all items in the trash? This action cannot be undone.")) {
      executeDelete({ type: "EMPTY_TRASH" });
    }
  };

  const cards = data?.cards || [];
  const lists = data?.lists || [];
  const boards = data?.boards || [];
  const folders = data?.folders || [];

  const filterItem = (item: any) => {
    if (!search) return true;
    return item.title?.toLowerCase().includes(search.toLowerCase());
  };

  const filteredCards = cards.filter(filterItem);
  const filteredLists = lists.filter(filterItem);
  const filteredBoards = boards.filter(filterItem);
  const filteredFolders = folders.filter(filterItem);

  const totalCount = cards.length + lists.length + boards.length + folders.length;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "folders", label: "Folders", count: folders.length },
    { key: "boards", label: "Boards", count: boards.length },
    { key: "lists", label: "Lists", count: lists.length },
    { key: "cards", label: "Cards", count: cards.length },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Trash Bin
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Restore deleted items or remove them permanently.
                </DialogDescription>
              </div>
            </div>

            {totalCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
                disabled={isDeleting || isRestoring}
                className="h-8 text-xs font-medium"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                Empty Trash
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search in trash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 max-h-[48vh]">
          {isLoading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Trash2 className="h-10 w-10 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Trash is empty</p>
              <p className="text-xs text-slate-400 mt-1">Deleted items will appear here.</p>
            </div>
          ) : (
            <>
              {activeTab === "all" && (
                <div className="space-y-2">
                  {filteredFolders.map((f: any) => renderItemRow(f, f.folderType || "FOLDER", executeRestore, executeDelete, isRestoring || isDeleting))}
                  {filteredBoards.map((b: any) => renderItemRow(b, "BOARD", executeRestore, executeDelete, isRestoring || isDeleting))}
                  {filteredLists.map((l: any) => renderItemRow(l, "LIST", executeRestore, executeDelete, isRestoring || isDeleting, l.board?.title))}
                  {filteredCards.map((c: any) => renderItemRow(c, "CARD", executeRestore, executeDelete, isRestoring || isDeleting, c.list?.board?.title))}
                  {filteredFolders.length === 0 && filteredBoards.length === 0 && filteredLists.length === 0 && filteredCards.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No matching items found.</p>
                  )}
                </div>
              )}

              {activeTab === "folders" && (
                <div className="space-y-2">
                  {filteredFolders.length === 0 ? renderEmptyTab("folders") : filteredFolders.map((f: any) => renderItemRow(f, f.folderType || "FOLDER", executeRestore, executeDelete, isRestoring || isDeleting))}
                </div>
              )}

              {activeTab === "boards" && (
                <div className="space-y-2">
                  {filteredBoards.length === 0 ? renderEmptyTab("boards") : filteredBoards.map((b: any) => renderItemRow(b, "BOARD", executeRestore, executeDelete, isRestoring || isDeleting))}
                </div>
              )}

              {activeTab === "lists" && (
                <div className="space-y-2">
                  {filteredLists.length === 0 ? renderEmptyTab("lists") : filteredLists.map((l: any) => renderItemRow(l, "LIST", executeRestore, executeDelete, isRestoring || isDeleting, l.board?.title))}
                </div>
              )}

              {activeTab === "cards" && (
                <div className="space-y-2">
                  {filteredCards.length === 0 ? renderEmptyTab("cards") : filteredCards.map((c: any) => renderItemRow(c, "CARD", executeRestore, executeDelete, isRestoring || isDeleting, c.list?.board?.title))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function renderEmptyTab(name: string) {
  return (
    <div className="py-8 text-center text-xs text-slate-400">
      No {name} in trash
    </div>
  );
}

function renderItemRow(
  item: any,
  type: string,
  onRestore: (data: any) => void,
  onDelete: (data: any) => void,
  disabled: boolean,
  contextTitle?: string
) {
  const getIcon = () => {
    switch (type) {
      case "CARD":
        return <CreditCard className="h-4 w-4 text-sky-600" />;
      case "LIST":
        return <ListOrdered className="h-4 w-4 text-indigo-600" />;
      case "BOARD":
        return <Layout className="h-4 w-4 text-emerald-600" />;
      default:
        return <Folder className="h-4 w-4 text-amber-600" />;
    }
  };

  const formattedType = type.replace(/_/g, " ").toLowerCase();

  return (
    <div
      key={`${type}-${item.id}`}
      className="flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/80 transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0">
          {getIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {item.title}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            <span className="capitalize">{formattedType}</span>
            {item.subtitle && ` • ${item.subtitle}`}
            {contextTitle && ` • Board: ${contextTitle}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRestore({ id: item.id, type, boardId: item.boardId || item.list?.board?.id })}
          disabled={disabled}
          className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Restore
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (window.confirm(`Permanently delete "${item.title}"?`)) {
              onDelete({ id: item.id, type, boardId: item.boardId || item.list?.board?.id });
            }
          }}
          disabled={disabled}
          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
