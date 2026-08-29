"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { verifyFolderPassword } from "@/actions/verify-folder-password";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FolderAuthWrapperProps {
  children: React.ReactNode;
  folderId: string;
}

export const FolderAuthWrapper = ({ children, folderId }: FolderAuthWrapperProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const { execute, fieldErrors, isLoading } = useAction(verifyFolderPassword, {
    onSuccess: (data) => {
      if (data.success) {
        setIsUnlocked(true);
        toast.success("Folder unlocked.");
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const password = formData.get("password") as string;
    execute({ id: folderId, password });
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full items-center justify-center min-h-[70vh] p-4">
      <Card className="w-full max-w-[420px] shadow-lg border border-black/10 rounded-xl overflow-hidden bg-white">
        <div className="h-1.5 w-full bg-black" />
        <CardHeader className="text-center pt-8 pb-4 space-y-3">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-black shadow-sm">
              <Lock className="h-7 w-7 text-black" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-black">Protected Folder</CardTitle>
          <CardDescription className="text-zinc-500 text-[15px] px-2">
            This team folder is secured. Please enter the password to access its contents.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form action={onSubmit} className="space-y-5">
            <FormInput
              id="password"
              label="Password"
              type="password"
              errors={fieldErrors}
            />
            <FormSubmit className="w-full bg-black hover:bg-black/90 text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors" disabled={isLoading}>
              Unlock Access
            </FormSubmit>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
