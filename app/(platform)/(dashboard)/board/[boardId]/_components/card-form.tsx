"use client";

import { useRef, forwardRef, ElementRef, KeyboardEventHandler, useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useOnClickOutside, useEventListener } from "usehooks-ts";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { createCard } from "@/actions/create-card";
import { getFolders, getYears, getMonths, getDays, getBoards, getLists } from "@/actions/get-destinations";
import { statusFromListTitle } from "@/lib/card-status";
import { useCardOverlayStore } from "@/hooks/use-card-assignment-overlay";

type CardFormProps = {
  listId: string;
  listTitle?: string;
  enableEditing: () => void;
  disableEditing: () => void;
  isEditing: boolean;
  isImpBoard?: boolean;
  onCardCreated?: (listId: string, card: any) => void;
  onCardSaved?: (listId: string, tempId: string, card: any) => void;
  onCardFailed?: (listId: string, tempId: string) => void;
};

const DestinationSelector = ({
  isLoading,
  folders,
  years,
  months,
  days,
  boards,
  lists,
  selectedFolderId,
  setSelectedFolderId,
  selectedYearId,
  setSelectedYearId,
  selectedMonthId,
  setSelectedMonthId,
  selectedDayId,
  setSelectedDayId,
  selectedBoardId,
  setSelectedBoardId,
  selectedListId,
  setSelectedListId,
}: any) => {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading destinations...</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        aria-label="Select destination folder"
        className="w-full text-sm rounded-md border p-2"
        value={selectedFolderId}
        onChange={(e) => {
          setSelectedFolderId(e.target.value);
          setSelectedYearId("");
          setSelectedMonthId("");
          setSelectedDayId("");
          setSelectedBoardId("");
          setSelectedListId("");
        }}
      >
        <option value="">Select Folder</option>
        {folders.map((f: any) => (
          <option key={f.id} value={f.id}>{f.title}</option>
        ))}
      </select>

      {selectedFolderId && (
        <select
          aria-label="Select destination year"
          className="w-full text-sm rounded-md border p-2"
          value={selectedYearId}
          onChange={(e) => {
            setSelectedYearId(e.target.value);
            setSelectedMonthId("");
            setSelectedDayId("");
            setSelectedBoardId("");
            setSelectedListId("");
          }}
        >
          <option value="">Select Year</option>
          {years.map((y: any) => (
            <option key={y.id} value={y.id}>{y.title}</option>
          ))}
        </select>
      )}

      {selectedYearId && (
        <select
          aria-label="Select destination month"
          className="w-full text-sm rounded-md border p-2"
          value={selectedMonthId}
          onChange={(e) => {
            setSelectedMonthId(e.target.value);
            setSelectedDayId("");
            setSelectedBoardId("");
            setSelectedListId("");
          }}
        >
          <option value="">Select Month</option>
          {months.map((m: any) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      )}

      {selectedMonthId && (
        <select
          aria-label="Select destination day"
          className="w-full text-sm rounded-md border p-2"
          value={selectedDayId}
          onChange={(e) => {
            setSelectedDayId(e.target.value);
            setSelectedBoardId("");
            setSelectedListId("");
          }}
        >
          <option value="">Select Day</option>
          {days.map((d: any) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
      )}

      {selectedDayId && (
        <select
          aria-label="Select destination board"
          className="w-full text-sm rounded-md border p-2"
          value={selectedBoardId}
          onChange={(e) => {
            setSelectedBoardId(e.target.value);
            setSelectedListId("");
          }}
        >
          <option value="">Select Board</option>
          {boards.map((b: any) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      )}

      {selectedBoardId && (
        <select
          aria-label="Select destination list"
          className="w-full text-sm rounded-md border p-2"
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
        >
          <option value="">Select List</option>
          {lists.map((l: any) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export const CardForm = forwardRef<HTMLTextAreaElement, CardFormProps>(
  ({ listId, listTitle, enableEditing, disableEditing, isEditing, isImpBoard, onCardCreated, onCardSaved, onCardFailed }, ref) => {
    const params = useParams();
    const formRef = useRef<HTMLFormElement>(null);

    const [folders, setFolders] = useState<any[]>([]);
    const [years, setYears] = useState<any[]>([]);
    const [months, setMonths] = useState<any[]>([]);
    const [days, setDays] = useState<any[]>([]);
    const [boards, setBoards] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);
    const [isLoadingDest, setIsLoadingDest] = useState(false);

    const [selectedFolderId, setSelectedFolderId] = useState("");
    const [selectedYearId, setSelectedYearId] = useState("");
    const [selectedMonthId, setSelectedMonthId] = useState("");
    const [selectedDayId, setSelectedDayId] = useState("");
    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [selectedListId, setSelectedListId] = useState("");

    useEffect(() => {
      if (isImpBoard && isEditing && folders.length === 0) {
        setIsLoadingDest(true);
        getFolders().then(data => {
          setFolders(data);
          setIsLoadingDest(false);
        });
      }
    }, [isImpBoard, isEditing, folders.length]);

    useEffect(() => {
      if (selectedFolderId) {
        getYears(selectedFolderId).then(setYears);
      } else {
        setYears([]);
      }
    }, [selectedFolderId]);

    useEffect(() => {
      if (selectedYearId) {
        getMonths(selectedYearId).then(setMonths);
      } else {
        setMonths([]);
      }
    }, [selectedYearId]);

    useEffect(() => {
      if (selectedMonthId) {
        getDays(selectedMonthId).then(setDays);
      } else {
        setDays([]);
      }
    }, [selectedMonthId]);

    useEffect(() => {
      if (selectedDayId) {
        getBoards(selectedDayId).then(setBoards);
      } else {
        setBoards([]);
      }
    }, [selectedDayId]);

    useEffect(() => {
      if (selectedBoardId) {
        getLists(selectedBoardId).then(setLists);
      } else {
        setLists([]);
      }
    }, [selectedBoardId]);

    const pendingTempId = useRef<string | null>(null);

    const { execute, fieldErrors } = useAction(createCard, {
      onSuccess: (data) => {
        toast.success(`Card "${data.title}" created.`);
        if (pendingTempId.current) {
          onCardSaved?.(listId, pendingTempId.current, data);
          useCardOverlayStore.getState().patchCard(data.id, {
            status: data.status,
            isActive: data.isActive,
          });
          pendingTempId.current = null;
        }
        formRef.current?.reset();
        setSelectedFolderId("");
        setSelectedYearId("");
        setSelectedMonthId("");
        setSelectedDayId("");
        setSelectedBoardId("");
        setSelectedListId("");
      },
      onError: (error) => {
        toast.error(error);
        if (pendingTempId.current) {
          onCardFailed?.(listId, pendingTempId.current);
          pendingTempId.current = null;
        }
      },
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        disableEditing();
      }
    };

    const onSubmit = (formData: FormData) => {
      const title = formData.get("title") as string;
      const listId = formData.get("listId") as string;
      const boardId = formData.get("boardId") as string;

      if (isImpBoard && !selectedListId) {
        toast.error("Please select a destination list.");
        return;
      }

      const tempId = `temp-card-${Date.now()}`;
      const listStatus = statusFromListTitle(listTitle);
      pendingTempId.current = tempId;
      onCardCreated?.(listId, {
        id: tempId,
        title,
        listId,
        boardId,
        order: Date.now(),
        description: null,
        priority: "Low",
        status: listStatus.status,
        isActive: listStatus.isActive,
        assignments: [],
        tags: [],
        _count: { attachments: 0, comments: 0, subtasks: 0 },
      });
      useCardOverlayStore.getState().patchCard(tempId, listStatus);

      execute({
        title,
        listId,
        boardId,
        ...(isImpBoard ? { targetListId: selectedListId } : {})
      });
    };

    useOnClickOutside(formRef as React.RefObject<HTMLElement>, disableEditing);
    useEventListener("keydown", onKeyDown);

    const onTextareaKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (
      e,
    ) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };



    if (isEditing) {
      return (
        <form
          ref={formRef}
          action={onSubmit}
          className="m-1 py-0.5 px-1 space-y-4"
        >
          <FormTextarea
            id="title"
            onKeyDown={onTextareaKeyDown}
            errors={fieldErrors}
            ref={ref}
            placeholder="Enter a title for this card..."
          />

          {isImpBoard && (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-xs text-muted-foreground">Select Destination</p>
              <DestinationSelector
                isLoading={isLoadingDest}
                folders={folders}
                years={years}
                months={months}
                days={days}
                boards={boards}
                lists={lists}
                selectedFolderId={selectedFolderId}
                setSelectedFolderId={setSelectedFolderId}
                selectedYearId={selectedYearId}
                setSelectedYearId={setSelectedYearId}
                selectedMonthId={selectedMonthId}
                setSelectedMonthId={setSelectedMonthId}
                selectedDayId={selectedDayId}
                setSelectedDayId={setSelectedDayId}
                selectedBoardId={selectedBoardId}
                setSelectedBoardId={setSelectedBoardId}
                selectedListId={selectedListId}
                setSelectedListId={setSelectedListId}
              />
            </div>
          )}

          <input hidden id="listId" name="listId" defaultValue={listId} />
          <input hidden id="boardId" name="boardId" defaultValue={params.boardId as string} />

          <div className="flex items-center gap-x-1">
            <FormSubmit>Add card</FormSubmit>
            <Button onClick={disableEditing} size="sm" variant="ghost">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="pt-2 px-2">
        <Button
          onClick={enableEditing}
          className="h-auto px-2 py-1.5 w-full justify-start text-muted-foreground text-sm"
          size="sm"
          variant="ghost"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a card
        </Button>
      </div>
    );
  },
);

CardForm.displayName = "CardForm";
