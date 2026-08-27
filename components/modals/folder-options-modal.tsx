"use client";

import { ElementRef, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, MoreHorizontal, Trash2 } from "lucide-react";
import Image from "next/image";

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
import { updateFolder } from "@/actions/update-folder";
import { deleteFolder } from "@/actions/delete-folder";

import { Folder as FolderModel } from "@prisma/client";

interface FolderOptionsModalProps {
  folder: FolderModel;
}

export const FolderOptionsModal = ({ folder }: FolderOptionsModalProps) => {
  let decodedPassword = folder.password || "";
  try {
    if (decodedPassword && (decodedPassword.startsWith("$2a$") || decodedPassword.startsWith("$2b$"))) {
      decodedPassword = "Old encrypted password (please reset)";
    } else if (decodedPassword) {
      const decoded = atob(decodedPassword);
      if (btoa(decoded) === decodedPassword) {
        decodedPassword = decoded;
      }
    }
  } catch {
    // Keep original if decoding fails
  }

  const closeRef = useRef<ElementRef<"button">>(null);
  const [logoBase64, setLogoBase64] = useState<string>(folder.logoUrl || "");

  const { execute: executeUpdate, fieldErrors: updateFieldErrors } = useAction(updateFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Folder updated successfully.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteFolder, {
    onSuccess: (data) => {
      closeRef.current?.click();
      toast.success("Folder deleted successfully.");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onUpdateSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const newPassword = formData.get("folderPassword") as string;
    const password = newPassword ? newPassword : folder.password;

    executeUpdate({ id: folder.id, title, logoUrl, password });
  };

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this folder? All boards inside it will be permanently lost.")) {
      executeDelete({ id: folder.id });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DialogTrigger>
      
      {/* We apply backdrop-blur-sm on DialogOverlay implicitly via Shadcn or directly here on DialogContent's parent by global css, but Shadcn dialog handles it. */}
      <DialogContent 
        className="w-[400px] p-0 overflow-hidden" 
        onClick={(e) => e.stopPropagation()} // Prevent bubbling to the Link wrapper
      >
        <div className="p-6 pt-8">
          <DialogTitle className="text-center text-xl font-semibold text-neutral-800 mb-6">
            Edit Team Folder
          </DialogTitle>
          <DialogClose ref={closeRef} asChild>
            <button className="hidden" />
          </DialogClose>

          <form action={onUpdateSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700">
                  Logo
                </label>
                <div className="flex items-center gap-x-4">
                  <div className="relative flex items-center justify-center h-16 w-16 min-w-[64px] border-2 border-dashed border-gray-300 rounded-md bg-gray-50 overflow-hidden">
                    {logoBase64 ? (
                      <Image src={logoBase64} alt="Upload preview" fill className="object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-2">
                      <label
                        htmlFor={`logoFile-${folder.id}`}
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1"
                      >
                        Change Logo
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
                  </div>
                  <input
                    id={`logoFile-${folder.id}`}
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
                defaultValue={folder.title}
                errors={updateFieldErrors}
              />
              <FormInput
                id="existingPassword"
                label="Existing Password"
                type="text"
                defaultValue={decodedPassword}
                disabled
              />
              <FormInput
                id="folderPassword"
                label="Change Password"
                type="text"
                defaultValue=""
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
            Delete Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
