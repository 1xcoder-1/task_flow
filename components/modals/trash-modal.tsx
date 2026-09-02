"use client";

import { useEffect, useState } from "react";
import { Trash2, RotateCcw, Layers, Layout, CreditCard, Folder, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTrashedItems } from "@/actions/get-trashed-items";
import { restoreItem } from "@/actions/restore-item";
import { deletePermanently } from "@/actions/delete-permanently";
import { useAction } from "@/hooks/use-action";

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashModal = ({ isOpen, onClose }: TrashModalProps) => {
  const [activeTab, setActiveTab] = useState<"cards" | "lists" | "boards" | "teams" | "subfolders">("cards");
  const [data, setData] = useState<{
    cards: any[];
    lists: any[];
    boards: any[];
    folders: any[];
  }>({ cards: [], lists: [], boards: [], folders: [] });
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    const res = await getTrashedItems();
    if (res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  const { execute: executeRestore } = useAction(restoreItem, {
    onSuccess: () => {
      toast.success("Item restored successfully!");
    },
    onError: (err) => {
      toast.error(err);
      fetchItems();
    },
  });

  const { execute: executeDelete } = useAction(deletePermanently, {
    onSuccess: () => {
      toast.success("Permanently deleted.");
    },
    onError: (err) => {
      toast.error(err);
      fetchItems();
    },
  });

  const handleRestore = (type: any, id: string, boardId?: string) => {
    // Instant optimistic update
    if (type === "CARD") {
      setData((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== id) }));
    } else if (type === "LIST") {
      setData((prev) => ({ ...prev, lists: prev.lists.filter((l) => l.id !== id) }));
    } else if (type === "BOARD") {
      setData((prev) => ({ ...prev, boards: prev.boards.filter((b) => b.id !== id) }));
    } else {
      setData((prev) => ({ ...prev, folders: prev.folders.filter((f) => f.id !== id) }));
    }

    executeRestore({ type, id, boardId });
  };

  const handleDeletePermanent = (type: any, id?: string, boardId?: string) => {
    if (type === "EMPTY_TRASH") {
      setData({ cards: [], lists: [], boards: [], folders: [] });
      executeDelete({ type });
      return;
    }

    // Instant optimistic update
    if (id) {
      if (type === "CARD") {
        setData((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== id) }));
      } else if (type === "LIST") {
        setData((prev) => ({ ...prev, lists: prev.lists.filter((l) => l.id !== id) }));
      } else if (type === "BOARD") {
        setData((prev) => ({ ...prev, boards: prev.boards.filter((b) => b.id !== id) }));
      } else {
        setData((prev) => ({ ...prev, folders: prev.folders.filter((f) => f.id !== id) }));
      }
      executeDelete({ type, id, boardId });
    }
  };

  const getDaysRemaining = (deletedAt: string | Date | null) => {
    if (!deletedAt) return "30 days left";
    const delDate = new Date(deletedAt);
    const expireDate = new Date(delDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const diffDays = Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 3600 * 24));
    return diffDays > 0 ? `${diffDays} days left` : "Expiring soon";
  };

  const teamFolders = data.folders.filter((f) => !f.folderType || f.folderType === "FOLDER");
  const subFolders = data.folders.filter((f) => f.folderType && f.folderType !== "FOLDER");

  const totalTrashed = data.cards.length + data.lists.length + data.boards.length + data.folders.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-neutral-900 border border-neutral-800 text-white p-6 rounded-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-x-2 text-lg font-bold text-white">
              <Trash2 className="h-5 w-5 text-rose-400" />
              Trash Bin ({totalTrashed})
            </DialogTitle>
            {totalTrashed > 0 && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isLoading}
                onClick={() => handleDeletePermanent("EMPTY_TRASH")}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 mr-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Empty Trash
              </Button>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Items in the trash will be permanently deleted after 30 days. You can restore them anytime.
          </p>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 mt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
              activeTab === "cards" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Cards ({data.cards.length})
          </button>
          <button
            onClick={() => setActiveTab("lists")}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
              activeTab === "lists" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Lists ({data.lists.length})
          </button>
          <button
            onClick={() => setActiveTab("boards")}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
              activeTab === "boards" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            Boards ({data.boards.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
              activeTab === "teams" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            Teams ({teamFolders.length})
          </button>
          <button
            onClick={() => setActiveTab("subfolders")}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
              activeTab === "subfolders" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Folders ({subFolders.length})
          </button>
        </div>

        {/* Tab Content List */}
        <div className="min-h-[220px] max-h-[50vh] overflow-y-auto pr-1 space-y-2 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-neutral-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
              <span className="text-xs">Loading trash items...</span>
            </div>
          ) : (
            <>
              {activeTab === "cards" && (
                data.cards.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed cards found.</p>
                ) : (
                  data.cards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between bg-neutral-800/40 p-3 rounded-lg border border-neutral-800 text-xs">
                      <div>
                        <div className="font-semibold text-neutral-200">{card.title}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          List: <span className="text-neutral-300">{card.list?.title || "Unknown"}</span> &bull; Board: <span className="text-neutral-300">{card.list?.board?.title || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                          {getDaysRemaining(card.deletedAt)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleRestore("CARD", card.id, card.list?.board?.id)}
                          className="h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeletePermanent("CARD", card.id, card.list?.board?.id)}
                          className="h-7 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === "lists" && (
                data.lists.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed lists found.</p>
                ) : (
                  data.lists.map((list) => (
                    <div key={list.id} className="flex items-center justify-between bg-neutral-800/40 p-3 rounded-lg border border-neutral-800 text-xs">
                      <div>
                        <div className="font-semibold text-neutral-200">{list.title}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Board: <span className="text-neutral-300">{list.board?.title || "Unknown"}</span> &bull; Cards: {list._count?.cards || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                          {getDaysRemaining(list.deletedAt)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleRestore("LIST", list.id, list.board?.id)}
                          className="h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeletePermanent("LIST", list.id, list.board?.id)}
                          className="h-7 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === "boards" && (
                data.boards.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed boards found.</p>
                ) : (
                  data.boards.map((board) => (
                    <div key={board.id} className="flex items-center justify-between bg-neutral-800/40 p-3 rounded-lg border border-neutral-800 text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-12 rounded bg-cover bg-center"
                          style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
                        />
                        <div>
                          <div className="font-semibold text-neutral-200">{board.title}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">Board</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                          {getDaysRemaining(board.deletedAt)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleRestore("BOARD", board.id)}
                          className="h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeletePermanent("BOARD", board.id)}
                          className="h-7 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === "teams" && (
                teamFolders.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed team folders found.</p>
                ) : (
                  teamFolders.map((folder: any) => (
                    <div key={folder.id} className="flex items-center justify-between bg-neutral-800/40 p-3 rounded-lg border border-neutral-800 text-xs">
                      <div>
                        <div className="font-semibold text-neutral-200">{folder.title}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Team Folder</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                          {getDaysRemaining(folder.deletedAt)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleRestore("FOLDER", folder.id)}
                          className="h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeletePermanent("FOLDER", folder.id)}
                          className="h-7 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === "subfolders" && (
                subFolders.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed date subfolders found.</p>
                ) : (
                  subFolders.map((folder: any) => {
                    const targetType = folder.folderType;
                    const subTitle = folder.subtitle || "Date Subfolder";
                    return (
                      <div key={folder.id} className="flex items-center justify-between bg-neutral-800/40 p-3 rounded-lg border border-neutral-800 text-xs">
                        <div>
                          <div className="font-semibold text-neutral-200">{folder.title}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{subTitle}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                            {getDaysRemaining(folder.deletedAt)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleRestore(targetType, folder.id)}
                            className="h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeletePermanent(targetType, folder.id)}
                            className="h-7 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
