"use client";

import { useEffect, useState, useCallback } from "react";
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

function getDaysRemaining(deletedAt?: string | Date | null, now: number = Date.now()) {
  if (!deletedAt) return "30 days left";
  const delTime = new Date(deletedAt).getTime();
  if (isNaN(delTime)) return "30 days left";

  const expireDate = delTime + 30 * 24 * 60 * 60 * 1000;
  const diffMs = expireDate - now;

  if (diffMs <= 0) return "Expired (Deleting...)";

  const totalHours = diffMs / (1000 * 60 * 60);
  const totalDays = Math.ceil(totalHours / 24);

  if (totalDays > 1) {
    return `${totalDays} day${totalDays === 1 ? "" : "s"} left`;
  }

  const diffHours = Math.floor(totalHours);
  if (diffHours >= 1) {
    return `${diffHours} hr${diffHours === 1 ? "" : "s"} left`;
  }

  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${diffMins} min${diffMins === 1 ? "" : "s"} left`;
}

const formatDeletedTime = (deletedAt?: Date | string | null) => {
  if (!deletedAt) return null;
  const d = new Date(deletedAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const TrashItemRow = ({
  title,
  subtitle,
  imageUrl,
  deletedAt,
  now,
  onRestore,
  onDelete,
}: {
  title: string;
  subtitle?: React.ReactNode;
  imageUrl?: string;
  deletedAt?: Date | string | null;
  now?: number;
  onRestore: () => void;
  onDelete: () => void;
}) => (
  <div className="flex items-center justify-between bg-neutral-800/40 p-3 rounded-lg border border-neutral-800 text-xs">
    <div className="flex items-center gap-3">
      {imageUrl && (
        <div
          className="h-8 w-12 rounded bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
      <div>
        <div className="font-semibold text-neutral-200">{title}</div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
          {subtitle && <span>{subtitle}</span>}
          {deletedAt && (
            <span className="text-neutral-500 text-[10px]">
              &bull; Trashed {formatDeletedTime(deletedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-medium">
        {getDaysRemaining(deletedAt, now)}
      </span>
      <Button
        size="sm"
        onClick={onRestore}
        className="h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
      >
        <RotateCcw className="h-3 w-3" /> Restore
      </Button>
      <Button
        size="sm"
        onClick={onDelete}
        className="h-7 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30"
      >
        Delete
      </Button>
    </div>
  </div>
);

const TrashTabSwitcher = ({
  activeTab,
  setActiveTab,
  cardsCount,
  listsCount,
  boardsCount,
  teamsCount,
  subfoldersCount,
}: {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  cardsCount: number;
  listsCount: number;
  boardsCount: number;
  teamsCount: number;
  subfoldersCount: number;
}) => (
  <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 mt-2 overflow-x-auto">
    <button
      onClick={() => setActiveTab("cards")}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
        activeTab === "cards" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
      }`}
    >
      <CreditCard className="h-3.5 w-3.5" />
      Cards ({cardsCount})
    </button>
    <button
      onClick={() => setActiveTab("lists")}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
        activeTab === "lists" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
      }`}
    >
      <Layers className="h-3.5 w-3.5" />
      Lists ({listsCount})
    </button>
    <button
      onClick={() => setActiveTab("boards")}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
        activeTab === "boards" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
      }`}
    >
      <Layout className="h-3.5 w-3.5" />
      Boards ({boardsCount})
    </button>
    <button
      onClick={() => setActiveTab("teams")}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
        activeTab === "teams" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
      }`}
    >
      <Folder className="h-3.5 w-3.5" />
      Teams ({teamsCount})
    </button>
    <button
      onClick={() => setActiveTab("subfolders")}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 ${
        activeTab === "subfolders" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-neutral-400 hover:text-white"
      }`}
    >
      <Calendar className="h-3.5 w-3.5" />
      Folders ({subfoldersCount})
    </button>
  </div>
);

export const TrashModal = ({ isOpen, onClose }: TrashModalProps) => {
  const [activeTab, setActiveTab] = useState<"cards" | "lists" | "boards" | "teams" | "subfolders">("cards");
  const [data, setData] = useState<{
    cards: any[];
    lists: any[];
    boards: any[];
    folders: any[];
  }>({ cards: [], lists: [], boards: [], folders: [] });
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTrashedItems();
      if (res.data) {
        setData(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    let isSubscribed = true;
    if (isOpen) {
      setIsLoading(true);
      getTrashedItems()
        .then((res) => {
          if (isSubscribed && res.data) {
            setData(res.data);
          }
        })
        .finally(() => {
          if (isSubscribed) {
            setIsLoading(false);
          }
        });
    }
    return () => {
      isSubscribed = false;
    };
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
        <TrashTabSwitcher
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cardsCount={data.cards.length}
          listsCount={data.lists.length}
          boardsCount={data.boards.length}
          teamsCount={teamFolders.length}
          subfoldersCount={subFolders.length}
        />

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
                    <TrashItemRow
                      key={card.id}
                      title={card.title}
                      subtitle={
                        <>
                          List: <span className="text-neutral-300">{card.list?.title || "Unknown"}</span> &bull; Board: <span className="text-neutral-300">{card.list?.board?.title || "Unknown"}</span>
                        </>
                      }
                      deletedAt={card.deletedAt}
                      now={now}
                      onRestore={() => handleRestore("CARD", card.id, card.list?.board?.id)}
                      onDelete={() => handleDeletePermanent("CARD", card.id, card.list?.board?.id)}
                    />
                  ))
                )
              )}

              {activeTab === "lists" && (
                data.lists.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed lists found.</p>
                ) : (
                  data.lists.map((list) => (
                    <TrashItemRow
                      key={list.id}
                      title={list.title}
                      subtitle={
                        <>
                          Board: <span className="text-neutral-300">{list.board?.title || "Unknown"}</span> &bull; Cards: {list._count?.cards || 0}
                        </>
                      }
                      deletedAt={list.deletedAt}
                      now={now}
                      onRestore={() => handleRestore("LIST", list.id, list.board?.id)}
                      onDelete={() => handleDeletePermanent("LIST", list.id, list.board?.id)}
                    />
                  ))
                )
              )}

              {activeTab === "boards" && (
                data.boards.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed boards found.</p>
                ) : (
                  data.boards.map((board) => (
                    <TrashItemRow
                      key={board.id}
                      title={board.title}
                      subtitle="Board"
                      imageUrl={board.imageThumbUrl}
                      deletedAt={board.deletedAt}
                      now={now}
                      onRestore={() => handleRestore("BOARD", board.id)}
                      onDelete={() => handleDeletePermanent("BOARD", board.id)}
                    />
                  ))
                )
              )}

              {activeTab === "teams" && (
                teamFolders.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed team folders found.</p>
                ) : (
                  teamFolders.map((folder: any) => (
                    <TrashItemRow
                      key={folder.id}
                      title={folder.title}
                      subtitle="Team Folder"
                      deletedAt={folder.deletedAt}
                      now={now}
                      onRestore={() => handleRestore("FOLDER", folder.id)}
                      onDelete={() => handleDeletePermanent("FOLDER", folder.id)}
                    />
                  ))
                )
              )}

              {activeTab === "subfolders" && (
                subFolders.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No trashed date subfolders found.</p>
                ) : (
                  subFolders.map((folder: any) => (
                    <TrashItemRow
                      key={folder.id}
                      title={folder.title}
                      subtitle={folder.subtitle || "Date Subfolder"}
                      deletedAt={folder.deletedAt}
                      now={now}
                      onRestore={() => handleRestore(folder.folderType, folder.id)}
                      onDelete={() => handleDeletePermanent(folder.folderType, folder.id)}
                    />
                  ))
                )
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
