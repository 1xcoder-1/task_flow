"use client";

import { ElementRef, useRef } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";

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
import { updateNestedFolder } from "@/actions/update-nested-folder";
import { deleteNestedFolder } from "@/actions/delete-nested-folder";

interface NestedFolderOptionsModalProps {
  folder: { id: string; title: string };
  type: "year" | "month" | "day";
}

export const NestedFolderOptionsModal = ({ folder, type }: NestedFolderOptionsModalProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);
  const pathname = usePathname();

  const { execute: executeUpdate, fieldErrors: updateFieldErrors } = useAction(updateNestedFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Folder updated successfully.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteNestedFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Folder deleted successfully.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onUpdateSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    executeUpdate({ id: folder.id, title, type, path: pathname });
  };

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this folder? All contents inside it will be permanently lost.")) {
      executeDelete({ id: folder.id, type, path: pathname });
    }
  };

  let typeLabel = "Folder";
  if (type === "year") typeLabel = "Year";
  if (type === "month") typeLabel = "Month";
  if (type === "day") typeLabel = "Day";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label="Folder Options"
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-black/10 rounded-full transition opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DialogTrigger>
      
      <DialogContent 
        className="w-[400px] p-0 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pt-8">
          <DialogTitle className="text-center text-xl font-semibold text-neutral-800 mb-6">
            Edit {typeLabel}
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
                defaultValue={folder.title}
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
            Delete {typeLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
