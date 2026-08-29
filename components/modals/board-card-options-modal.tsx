"use client";

import { ElementRef, useRef } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { updateBoard } from "@/actions/update-board";
import { deleteBoard } from "@/actions/delete-board";

interface BoardCardOptionsModalProps {
  board: { id: string; title: string };
}

export const BoardCardOptionsModal = ({ board }: BoardCardOptionsModalProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);

  const { execute: executeUpdate, fieldErrors: updateFieldErrors } = useAction(updateBoard, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Board updated successfully.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteBoard, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Board deleted successfully.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onUpdateSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    executeUpdate({ id: board.id, title });
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this board? All contents inside it will be permanently lost.")) {
      executeDelete({ id: board.id });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label="Card Options"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-2 right-2 p-1.5 text-white hover:bg-white/30 bg-black/20 rounded-md transition opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 z-10"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DialogTrigger>
      
      <DialogContent 
        className="w-[400px] p-0 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pt-8">
          <DialogTitle className="text-center text-xl font-semibold text-neutral-800 mb-6">
            Edit Board
          </DialogTitle>
          <DialogClose ref={closeRef} asChild>
            <button aria-label="Close dialog" className="hidden" />
          </DialogClose>

          <form action={onUpdateSubmit} className="space-y-4">
            <div className="space-y-4">
              <FormInput
                id="title"
                label="Name"
                type="text"
                defaultValue={board.title}
                errors={updateFieldErrors}
              />
            </div>
            <FormSubmit className="w-full mt-4">Save Changes</FormSubmit>
          </form>
        </div>

        <div className="bg-rose-50 px-6 py-4 border-t border-rose-100 flex items-center justify-between">
          <div className="text-sm text-rose-600 font-medium">
            Danger Zone
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDelete}
            disabled={isDeleting}
            type="button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
