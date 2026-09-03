"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useEventListener, useOnClickOutside } from "usehooks-ts";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { ListWrapper } from "./list-wrapper";
import { useAction } from "@/hooks/use-action";
import { createList } from "@/actions/create-list";
import { toast } from "sonner";

type ListFormProps = {
  onListCreated?: (list: any) => void;
  onListSaved?: (tempId: string, list: any) => void;
  onListFailed?: (tempId: string) => void;
};

export const ListForm = ({ onListCreated, onListSaved, onListFailed }: ListFormProps) => {
  const params = useParams();

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingTempId = useRef<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const { execute, fieldErrors } = useAction(createList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" created.`);
      if (pendingTempId.current) {
        onListSaved?.(pendingTempId.current, data);
        pendingTempId.current = null;
      }
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
      if (pendingTempId.current) {
        onListFailed?.(pendingTempId.current);
        pendingTempId.current = null;
      }
    },
  });

  const onSubmit = (formData: FormData) => {
    const title = (formData.get("title") as string)?.trim();
    const boardId = formData.get("boardId") as string;
    if (!title || title.length < 3) {
      toast.error("Title is too short.");
      return;
    }

    const tempId = `temp-list-${Date.now()}`;
    pendingTempId.current = tempId;
    onListCreated?.({
      id: tempId,
      title,
      boardId,
      order: Date.now(),
      cards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    disableEditing();
    execute({ title, boardId });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing();
    }
  };

  useEventListener("keydown", onKeyDown);
  useOnClickOutside(formRef as React.RefObject<HTMLElement>, disableEditing);

  if (isEditing) {
    return (
      <ListWrapper>
        <form
          action={onSubmit}
          ref={formRef}
          className="w-full p-3 rounded-md bg-white space-y-4 shadow-md"
        >
          <FormInput
            ref={inputRef}
            id="title"
            errors={fieldErrors}
            className="text-sm px-2 py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition"
            placeholder="Enter list title..."
          />

          <input
            type="hidden"
            hidden
            aria-hidden
            value={params.boardId}
            name="boardId"
          />

          <div className="flex items-center gap-x-1">
            <FormSubmit>Add list</FormSubmit>
            <Button onClick={disableEditing} size="sm" variant="ghost">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </ListWrapper>
    );
  }

  return (
    <ListWrapper>
      <button
        onClick={enableEditing}
        className="w-full rounded-md bg-white/80 hover:bg-white/50 transition p-3 flex items-center font-medium text-sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add a list
      </button>
    </ListWrapper>
  );
};
