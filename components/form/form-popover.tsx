"use client";

import { ElementRef, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { FormPicker } from "@/components/form/form-picker";
import { useAction } from "@/hooks/use-action";
import { createBoard } from "@/actions/create-board";

type FormPopoverProps = {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export const FormPopover = ({
  children,
  side = "bottom",
  align,
  sideOffset,
}: FormPopoverProps) => {
  const router = useRouter();
  const closeRef = useRef<ElementRef<"button">>(null);

  const params = useParams();

  const { execute, fieldErrors } = useAction(createBoard, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Board created.");
      router.push(`/board/${data.id}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const image = formData.get("image") as string;
    const dayFolderId = params.dayId as string;

    execute({ title, image, dayFolderId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-96 max-w-[400px] pt-3">
        <div className="text-sm font-medium text-center text-neutral-600 pb-4">
          Create board
        </div>

        <DialogClose ref={closeRef} asChild>
          <button className="hidden" />
        </DialogClose>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-4">
            <FormPicker id="image" errors={fieldErrors} />
            <FormInput
              id="title"
              label="Board title"
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
