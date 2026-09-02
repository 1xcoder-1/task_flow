import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder, User2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { FormFolderPopover } from "@/components/form/form-folder-popover";
import { FolderOptionsModal } from "@/components/modals/folder-options-modal";
import { db } from "@/lib/db";
import { Folder as FolderModel } from "@prisma/client";

export const BoardList = async () => {
  const { orgId, orgRole } = await auth();
  const isAdmin = orgRole === "org:admin";

  if (!orgId) return redirect("/select-org");

  let folders = await (db.folder as any).findMany({
    where: {
      orgId,
      isArchived: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const impFolderExists = folders.some((f: any) => f.title === "Important");

  if (!impFolderExists) {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "app/org.init",
      data: { orgId }
    });
    // We do NOT wait for it to finish or add it to folders array immediately
    // so the UI can load in real-time.
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
      </div>

      <div className="flex flex-wrap gap-3 -ml-2">
        {folders.map((folder: FolderModel) => (
          <div key={folder.id} className="group flex flex-col w-40">
            <Link
              href={`/organization/${orgId}/folder/${folder.id}`}
              className="w-full rounded-md hover:bg-black/5 p-1 pb-1 transition"
            >
              <div
                style={folder.logoUrl ? { backgroundImage: `url(${folder.logoUrl})` } : undefined}
                className="relative aspect-square w-full bg-no-repeat bg-center bg-contain bg-amber-100 rounded-lg overflow-hidden flex items-center justify-center border border-amber-300 shadow-sm"
              >
                {!folder.logoUrl && (
                  <Folder className="h-12 w-12 text-amber-500" fill="currentColor" />
                )}
              </div>
            </Link>
            <div className="flex items-center justify-between gap-x-2 pl-1 pr-0 pt-1 overflow-hidden w-full">
              <Link 
                href={`/organization/${orgId}/folder/${folder.id}`} 
                className="font-medium text-sm text-neutral-700 truncate hover:underline max-w-[75%] ml-1"
              >
                {folder.title}
              </Link>
              <div className="mr-4 flex-shrink-0">
                {isAdmin && folder.title !== "Important" && <FolderOptionsModal folder={folder} />}
              </div>
            </div>
          </div>
        ))}
        {isAdmin && (
          <FormFolderPopover sideOffset={10} side="right">
            <div className="group flex flex-col w-40">
              <div
                aria-label="Create Team"
                role="button"
                className="w-full rounded-md hover:bg-black/5 p-1 pb-1 transition cursor-pointer"
              >
                <div className="relative aspect-square w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm">
                  <Folder className="h-10 w-10 text-gray-500" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-x-2 pl-1 pr-0 pt-1 overflow-hidden w-full">
                <p className="font-medium text-sm text-neutral-600 truncate ml-1">
                  Create Team
                </p>
              </div>
            </div>
          </FormFolderPopover>
        )}
      </div>
    </div>
  );
};

BoardList.Skeleton = function SkeletonBoardList() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
    </div>
  );
};
