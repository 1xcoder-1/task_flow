"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, Layout, ListFilter, CreditCard, Loader2, ArrowRight, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCardModal } from "@/hooks/use-card-modal";

interface SearchResult {
  boards: {
    id: string;
    title: string;
    type: string;
    folderId?: string | null;
    folderTitle?: string | null;
    isPasswordProtected?: boolean;
    dayFolderUrl?: string | null;
    url: string;
  }[];
  lists: {
    id: string;
    title: string;
    type: string;
    boardId: string;
    boardTitle: string;
    folderId?: string | null;
    folderTitle?: string | null;
    isPasswordProtected?: boolean;
    dayFolderUrl?: string | null;
    url: string;
  }[];
  cards: {
    id: string;
    title: string;
    type: string;
    priority?: string;
    boardId: string;
    boardTitle: string;
    listTitle: string;
    folderId?: string | null;
    folderTitle?: string | null;
    isPasswordProtected?: boolean;
    dayFolderUrl?: string | null;
    url: string;
  }[];
}

export const CommandPalette = () => {
  const router = useRouter();
  const cardModal = useCardModal();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ boards: [], lists: [], cards: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset search state on modal close so no search history is shown
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({ boards: [], lists: [], cards: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Fetch search results debounced
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ boards: [], lists: [], cards: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const allItems = [
    ...(results.boards || []).map((b) => ({ ...b, kind: "Board" as const })),
    ...(results.lists || []).map((l) => ({ ...l, kind: "List" as const })),
    ...(results.cards || []).map((c) => ({ ...c, kind: "Card" as const })),
  ];

  const handleSelect = useCallback(
    (item: (typeof allItems)[0]) => {
      setIsOpen(false);
      setQuery("");

      if (item.kind === "Board") {
        // Go directly to the exact Day Folder page where the board exists
        const targetUrl = item.dayFolderUrl || item.url;
        router.push(targetUrl);
      } else if (item.kind === "Card") {
        // Go directly to the exact board URL /board/${boardId}?cardId=${cardId}
        const urlParams = new URLSearchParams(item.url.split("?")[1] || "");
        const cardId = urlParams.get("cardId") || item.id;

        if (typeof window !== "undefined" && window.location.pathname.startsWith(`/board/${item.boardId}`)) {
          cardModal.onOpen(cardId);
        } else {
          router.push(item.url);
        }
      } else {
        // List: Go directly to exact board URL /board/${boardId}
        router.push(item.url);
      }
    },
    [router, cardModal]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex]);
      }
    }
  };

  return (
    <>
      {/* Quick Launch Trigger Button in UI */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-x-2 text-xs text-neutral-400 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-700/50 hover:border-sky-500/50 transition-all rounded-lg px-3 py-1.5 backdrop-blur-md shadow-sm group"
      >
        <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-sky-400 transition-colors" />
        <span className="group-hover:text-neutral-200 transition-colors">Quick search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-1.5 font-mono text-[10px] font-medium text-neutral-400 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 max-w-2xl bg-neutral-900/95 border-neutral-800 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-xl">
          <div className="flex items-center border-b border-neutral-800 px-4 py-3 gap-x-3 bg-neutral-950/40">
            <Search className="w-5 h-5 text-sky-400 animate-pulse" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search boards, lists, and cards..."
              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-neutral-100 placeholder:text-neutral-500 text-sm h-9"
              autoFocus
            />
            {loading && <Loader2 className="w-4 h-4 text-sky-400 animate-spin ml-auto" />}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-700 bg-neutral-800/80 px-1.5 font-mono text-[10px] font-medium text-neutral-400">
              ESC
            </kbd>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
            {query.trim().length < 2 && (
              <div className="py-8 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-y-2">
                <Command className="w-8 h-8 text-neutral-700" />
                <p>Type at least 2 characters to search boards, lists &amp; cards.</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] bg-neutral-800/50 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded">⌘K anywhere</span>
                  <span className="text-[10px] bg-neutral-800/50 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded">↑↓ to navigate</span>
                  <span className="text-[10px] bg-neutral-800/50 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded">↵ to open</span>
                </div>
              </div>
            )}

            {query.trim().length >= 2 && !loading && allItems.length === 0 && (
              <div className="py-10 text-center text-xs text-neutral-400">
                No matching boards, lists, or cards found for &quot;<span className="text-sky-400">{query}</span>&quot;
              </div>
            )}

            {allItems.length > 0 && (
              <div className="space-y-1">
                {allItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`${item.kind}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-x-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                        isSelected
                          ? "bg-sky-500/15 border border-sky-500/30 text-sky-200"
                          : "hover:bg-neutral-800/50 border border-transparent text-neutral-300"
                      }`}
                    >
                      {item.kind === "Board" && (
                        <div className="w-7 h-7 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                          <Layout className="w-4 h-4" />
                        </div>
                      )}
                      {item.kind === "List" && (
                        <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <ListFilter className="w-4 h-4" />
                        </div>
                      )}
                      {item.kind === "Card" && (
                        <div className="w-7 h-7 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-x-2">
                          <span className="font-medium truncate text-neutral-100">{item.title}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                            {item.kind}
                          </span>
                          {item.isPasswordProtected && (
                            <span className="flex items-center gap-x-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Lock className="w-3 h-3 text-amber-400" />
                              Password Required
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {item.kind === "Board" && (item.folderTitle ? `Folder: ${item.folderTitle}` : "Board")}
                          {item.kind === "List" && `${item.boardTitle}`}
                          {item.kind === "Card" && `${item.boardTitle} → ${item.listTitle}`}
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? "text-sky-400 translate-x-0.5" : "text-neutral-600 opacity-0"}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

