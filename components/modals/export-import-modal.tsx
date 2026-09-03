"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListWithCards } from "@/types";
import {
  exportToCSV,
  exportToJSON,
  parseTrelloJSON,
  parseCSVImport,
  ExportOptions,
} from "@/lib/board-export";
import { importBoardData } from "@/actions/import-board-data";

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardTitle: string;
  lists: ListWithCards[];
}

const EXPORT_FIELDS = [
  { key: "includeStatus", label: "Status" },
  { key: "includePriority", label: "Priority" },
  { key: "includeDueDate", label: "Due Date" },
  { key: "includeAssignments", label: "Assignees" },
  { key: "includeTags", label: "Tags" },
  { key: "includeSubtasks", label: "Subtasks" },
  { key: "includeComments", label: "Comments" },
  { key: "includeLinks", label: "Web Links" },
] as const;

type FieldKey = (typeof EXPORT_FIELDS)[number]["key"];

const ExportImportPreviewBox = ({
  importedPreview,
  isImporting,
  onConfirmImport,
}: {
  importedPreview: any;
  isImporting: boolean;
  onConfirmImport: () => void;
}) => (
  <div className="bg-sky-950/40 border border-sky-800/50 rounded-lg p-3.5 space-y-2">
    <div className="text-xs font-semibold text-sky-300">
      Ready to import: &ldquo;{importedPreview.boardName}&rdquo;
    </div>
    <div className="text-xs text-sky-200/70">
      {importedPreview.lists.length} lists &bull;{" "}
      {importedPreview.lists.reduce((a: number, l: any) => a + (l.cards?.length || 0), 0)}{" "}
      cards
    </div>
    <div className="text-xs text-sky-300/60 space-y-0.5 max-h-36 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 pr-1">
      {importedPreview.lists.map((l: any) => (
        <div key={l.id || l.title}>
          <span className="font-medium">{l.title}</span>
          {" — "}
          {l.cards?.length || 0} cards
        </div>
      ))}
    </div>
    <Button
      onClick={onConfirmImport}
      disabled={isImporting}
      className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs mt-1 h-9 flex items-center justify-center gap-2"
    >
      {isImporting
        ? "Importing data into board..."
        : "Confirm & Import into Board"}
    </Button>
  </div>
);

export const ExportImportModal = ({
  isOpen,
  onClose,
  boardId,
  boardTitle,
  lists,
}: ExportImportModalProps) => {
  // Export state
  const [headingsOnly, setHeadingsOnly] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<Record<FieldKey, boolean>>({
    includeStatus: true,
    includePriority: true,
    includeDueDate: true,
    includeAssignments: true,
    includeTags: true,
    includeSubtasks: true,
    includeComments: true,
    includeLinks: true,
  });

  // Import state
  const [importedPreview, setImportedPreview] = useState<{
    boardName: string;
    lists: any[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSection, setImportSection] = useState(false);

  const toggleField = (key: FieldKey) => {
    setFieldOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const buildExportOptions = (): ExportOptions => {
    if (headingsOnly) return { includeTitleOnly: true };
    return { includeTitleOnly: false, ...fieldOptions };
  };

  const buildExportCards = () =>
    lists.flatMap((l) =>
      (l.cards || []).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        listTitle: l.title,
        createdAt: new Date(c.createdAt).toLocaleDateString(),
        dueDate: c.dueDate ? new Date(c.dueDate).toLocaleDateString() : null,
        priority: (c as any).priority || null,
        status: (c as any).status || null,
        subtasks: (c as any).subtasks || [],
        comments: (c as any).comments || [],
        attachments: (c as any).attachments || [],
        assignments: ((c as any).assignments || []).map((a: any) => ({
          userId: a.userId || "",
          userName: a.userName || "",
          userImage: a.userImage || "",
        })),
        tags: (c as any).tags || [],
      }))
    );

  const handleExportCSV = () => {
    try {
      exportToCSV(boardTitle, buildExportCards(), buildExportOptions());
      toast.success("Board exported to CSV successfully!");
    } catch {
      toast.error("Failed to export board to CSV.");
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(boardTitle, buildExportCards(), buildExportOptions());
      toast.success("Board exported to JSON successfully!");
    } catch {
      toast.error("Failed to export board to JSON.");
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVImport(text);
        setImportedPreview(parsed);
        toast.success(
          `Read CSV: ${parsed.lists.length} lists, ${parsed.lists.reduce(
            (a, l) => a + l.cards.length,
            0
          )} cards`
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to parse CSV file.");
        setImportedPreview(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleJSONFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseTrelloJSON(text);
        setImportedPreview(parsed);
        toast.success(
          `Read JSON: "${parsed.boardName}" — ${parsed.lists.length} lists`
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to parse JSON file.");
        setImportedPreview(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!importedPreview) return;
    setIsImporting(true);
    try {
      await importBoardData({ boardId, listsData: importedPreview.lists });
      const totalCards = importedPreview.lists.reduce(
        (a, l) => a + (l.cards?.length || 0),
        0
      );
      toast.success(
        `Imported ${importedPreview.lists.length} lists and ${totalCards} cards!`
      );
      setImportedPreview(null);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to import board data.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-neutral-900 border border-neutral-800 text-white p-0 rounded-xl overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-neutral-800">
          <DialogTitle className="flex items-center gap-x-2.5 text-base font-semibold text-white">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400 shrink-0" />
            Export &amp; Import Board
          </DialogTitle>
          <p className="text-xs text-neutral-400 mt-0.5">
            Export &ldquo;{boardTitle}&rdquo; to CSV/JSON, or import data from a
            backup file.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* ── EXPORT SECTION ── */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export Options
            </h4>

            {/* Headings Only toggle */}
            <button
              type="button"
              onClick={() => setHeadingsOnly((v) => !v)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${headingsOnly
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                  : "bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:border-neutral-600"
                }`}
            >
              <span>Export Headings Only (Card &amp; List Titles)</span>
              <div
                className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${headingsOnly
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-neutral-500"
                  }`}
              >
                {headingsOnly && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
            </button>

            {/* Individual field options — only active when headingsOnly is OFF */}
            <div
              className={`grid grid-cols-2 gap-2 transition-opacity duration-200 ${headingsOnly ? "opacity-30 pointer-events-none" : "opacity-100"
                }`}
            >
              {EXPORT_FIELDS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleField(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${fieldOptions[key]
                      ? "bg-sky-500/10 border-sky-500/40 text-sky-300"
                      : "bg-neutral-800/60 border-neutral-700/50 text-neutral-500 hover:border-neutral-600"
                    }`}
                >
                  <div
                    className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${fieldOptions[key]
                        ? "bg-sky-500 border-sky-500"
                        : "border-neutral-600"
                      }`}
                  >
                    {fieldOptions[key] && (
                      <Check className="h-2 w-2 text-white" />
                    )}
                  </div>
                  {label}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleExportCSV}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 flex items-center justify-center gap-1.5 font-medium"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportJSON}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs h-9 flex items-center justify-center gap-1.5 font-medium"
              >
                <FileJson className="h-3.5 w-3.5" />
                Export JSON
              </Button>
            </div>

            <p className="text-[11px] text-neutral-500">
              Images &amp; document files are always excluded. Assignee names are
              exported but cannot be re-linked automatically on import.
            </p>
          </div>

          {/* ── DIVIDER ── */}
          <div className="border-t border-neutral-800" />

          {/* ── IMPORT SECTION ── */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setImportSection((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Import Board Data
              </span>
              {importSection ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {importSection && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-xs text-neutral-400">
                  Upload a CSV or JSON export file. Lists, cards, subtasks,
                  comments, links, status, priority, and due dates will all be
                  restored.
                </p>

                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs px-3 py-2.5 rounded-lg border border-neutral-700 font-medium flex items-center justify-center gap-1.5 transition">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileChange}
                      className="hidden"
                    />
                  </label>

                  <label className="flex-1 cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs px-3 py-2.5 rounded-lg border border-neutral-700 font-medium flex items-center justify-center gap-1.5 transition">
                    <FileJson className="h-3.5 w-3.5 text-sky-400" />
                    Upload JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJSONFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {importedPreview && (
                  <ExportImportPreviewBox
                    importedPreview={importedPreview}
                    isImporting={isImporting}
                    onConfirmImport={handleConfirmImport}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
