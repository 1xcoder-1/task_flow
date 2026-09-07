"use client";

import { ElementRef, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { createFolder } from "@/actions/create-folder";
import { compressLogoImage } from "@/lib/compress-media";

type FormFolderPopoverProps = {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export const FormFolderPopover = ({
  children,
  side = "bottom",
  align,
  sideOffset,
}: FormFolderPopoverProps) => {
  const router = useRouter();
  const closeRef = useRef<ElementRef<"button">>(null);
  const [logoBase64, setLogoBase64] = useState<string>("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressLogoImage(file);
        setLogoBase64(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const { execute, fieldErrors } = useAction(createFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Folder created.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const password = (formData.get("password") as string) || "";

    execute({ title, logoUrl, password });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-96 max-w-[400px] pt-3">
        <div className="text-sm font-medium text-center text-neutral-600 pb-4">
          Create Team
        </div>

        <DialogClose ref={closeRef} asChild>
          <button aria-label="Close dialog" className="hidden" />
        </DialogClose>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="logoFile" className="text-sm font-semibold text-neutral-700">
                Logo
              </label>
              <div className="flex items-center gap-x-4">
                <div className="relative flex items-center justify-center h-16 w-16 min-w-[64px] border-2 border-dashed border-gray-300 rounded-md bg-gray-50 overflow-hidden">
                  {logoBase64 ? (
                    <Image src={logoBase64} alt="Upload preview" fill sizes="64px" className="object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-center gap-x-2">
                    <label
                      htmlFor="logoFile"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1"
                    >
                      Upload
                    </label>
                    {logoBase64 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLogoBase64("");
                        }}
                        className="text-xs text-rose-500 hover:underline px-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended size 1:1, up to 10MB.
                  </p>
                </div>
                <input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input type="hidden" name="logoUrl" value={logoBase64} />
              </div>
            </div>
            <FormInput
              id="title"
              label="Team name"
              type="text"
              errors={fieldErrors}
            />
            <FormInput
              id="password"
              label="Folder Password"
              type="password"
              errors={fieldErrors}
            />
          </div>

          <FormSubmit className="w-full">Create</FormSubmit>
        </form>
      </DialogContent>
    </Dialog>
  );
};
