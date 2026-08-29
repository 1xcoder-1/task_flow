"use client";

import { ElementRef, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";

import { createYearFolder } from "@/actions/create-year-folder";
import { createMonthFolder } from "@/actions/create-month-folder";
import { createDayFolder } from "@/actions/create-day-folder";

type FormGenericFolderPopoverProps = {
  children: React.ReactNode;
  type: "year" | "month" | "day";
  parentId: string;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export const FormGenericFolderPopover = ({
  children,
  type,
  parentId,
  side = "bottom",
  align,
  sideOffset,
}: FormGenericFolderPopoverProps) => {
  const router = useRouter();
  const closeRef = useRef<ElementRef<"button">>(null);

  const { execute: executeYear, fieldErrors: yearErrors } = useAction(createYearFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Year Folder created.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeMonth, fieldErrors: monthErrors } = useAction(createMonthFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Month Folder created.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDay, fieldErrors: dayErrors } = useAction(createDayFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Day Folder created.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    
    if (type === "year") {
      executeYear({ title, folderId: parentId });
    } else if (type === "month") {
      executeMonth({ title, yearFolderId: parentId });
    } else if (type === "day") {
      executeDay({ title, monthFolderId: parentId });
    }
  };

  const fieldErrors = type === "year" ? yearErrors : type === "month" ? monthErrors : dayErrors;
  const label = type === "year" ? "Year" : type === "month" ? "Month" : "Day";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-96 max-w-[400px] pt-3">
        <div className="text-sm font-medium text-center text-neutral-600 pb-4 capitalize">
          Create {label} Folder
        </div>

        <DialogClose ref={closeRef} asChild>
          <button aria-label="Close dialog" className="hidden" />
        </DialogClose>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-4">
            <FormInput
              id="title"
              label={`${label} name`}
              type="text"
              errors={fieldErrors}
            />
          </div>

          <FormSubmit className="w-full">Create</FormSubmit>
        </form>
      </DialogContent>
    </Dialog>
  );
};
