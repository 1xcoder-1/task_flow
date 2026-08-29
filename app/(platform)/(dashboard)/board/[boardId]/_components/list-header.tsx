"use client";

import { useState, useEffect, useRef, ElementRef } from "react";
import { toast } from "sonner";
import { useEventListener } from "usehooks-ts";
import { List } from "@prisma/client";

import { FormInput } from "@/components/form/form-input";
import { ListOptions } from "./list-options";
import { useAction } from "@/hooks/use-action";
import { updateList } from "@/actions/update-list";

import { ListWithCards } from "@/types";
import { GripVertical, PlusCircle } from "lucide-react";

type ListHeaderProps = {
  data: ListWithCards;
  onAddCard: () => void;
  dragHandleProps?: any;
};

export const ListHeader = ({ data, onAddCard, dragHandleProps }: ListHeaderProps) => {
  const [title, setTitle] = useState(data.title);
  const [isEditing, setIsEditing] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const { execute } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    if (title === data.title) return disableEditing();

    execute({
      title,
      id,
      boardId,
    });
  };

  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      formRef.current?.requestSubmit();
    }
  };

  useEventListener("keydown", onKeyDown);

  return (
    <div className="pt-3 px-3 pb-2 text-sm font-semibold flex justify-between items-center gap-x-2">
      <div className="flex items-center gap-x-2 w-full">
        {isEditing ? (
          <form ref={formRef} action={onSubmit} className="flex-1 px-[2px]">
            <input
              type="hidden"
              id="id"
              name="id"
              value={data.id}
              hidden
              aria-hidden
            />
            <input
              type="hidden"
              id="boardId"
              name="boardId"
              value={data.boardId}
              hidden
              aria-hidden
            />
            <FormInput
              ref={inputRef}
              onBlur={onBlur}
              id="title"
              placeholder="Enter list title.."
              defaultValue={title}
              className="text-sm px-[7px] py-1 h-7 font-semibold border-transparent hover:border-input focus:border-input transition bg-white"
            />
            <button type="button" hidden aria-disabled />
          </form>
        ) : (
          <button
            type="button"
            onClick={enableEditing}
            className="text-base font-semibold border-transparent cursor-text truncate text-black text-left"
          >
            {data.title}
          </button>
        )}
        {!isEditing && (
          <div className="bg-gray-200/60 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center justify-center">
            {data.cards?.length || 0}
          </div>
        )}
      </div>

      <div className="flex items-center gap-x-1 text-black">
        <div 
          {...dragHandleProps}
          className="p-1 hover:bg-gray-200 rounded-md cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <ListOptions onAddCard={onAddCard} data={data} />
        <button 
          type="button"
          onClick={onAddCard}
          aria-label="Add a card"
          className="p-1 hover:bg-gray-200 rounded-md cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
