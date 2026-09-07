import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder, User2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { FormFolderPopover } from "@/components/form/form-folder-popover";
import { FolderOptionsModal } from "@/components/modals/folder-options-modal";
import { db } from "@/lib/db";
import { Folder as FolderModel } from "@prisma/client";

interface BoardListProps {
  orgId: string;
  isAdmin: boolean;
}

export const BoardList = async ({ orgId, isAdmin }: BoardListProps) => {
  if (!orgId) return redirect("/select-org");

  let folders = await (db.folder as any).findMany({
    where: {
      orgId,
      isArchived: false,
    },
    select: {
      id: true,
      orgId: true,
      title: true,
      logoUrl: true,
      password: true,
      createdAt: true,
      updatedAt: true,
      isArchived: true,
      deletedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const impFolderExists = folders.some((f: any) => f.title === "Important");

  if (!impFolderExists) {
    import("@/inngest/client")
      .then(({ inngest }) => {
        inngest.send({
          name: "app/org.init",
          data: { orgId },
        }).catch((err) => console.error("Failed to send app/org.init event", err));
      })
      .catch((err) => console.error("Failed to load inngest client", err));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
      </div>

      <div className="flex flex-wrap gap-3 -ml-2 overflow-auto folder-scrollbar max-h-[calc(100vh-200px)] p-1">
        {folders.map((folder: FolderModel) => (
          <div key={folder.id} className="group flex flex-col w-40">
            <Link
              href={`/organization/${orgId}/folder/${folder.id}`}
              prefetch={true}
              className="w-full rounded-md hover:bg-black/5 p-1 pb-1 transition"
            >
              <div className="relative aspect-square w-full bg-amber-100 rounded-lg overflow-hidden flex items-center justify-center border border-amber-300 shadow-sm">
                {folder.logoUrl ? (
                  <img
                    src={folder.logoUrl}
                    alt={folder.title}
                    loading="lazy"
                    decoding="async"
                    width={160}
                    height={160}
                    className="h-full w-full object-contain p-2 transition-transform duration-150 group-hover:scale-105"
                  />
                ) : (
                  <Folder className="h-12 w-12 text-amber-500 transition-transform duration-150 group-hover:scale-105" fill="currentColor" />
                )}
              </div>
            </Link>
            <div className="flex items-center justify-between gap-x-2 pl-1 pr-0 pt-1 overflow-hidden w-full">
              <Link 
                href={`/organization/${orgId}/folder/${folder.id}`} 
                prefetch={true}
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
    <div className="flex flex-wrap gap-3 -ml-2 p-1">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col w-40 space-y-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-28 ml-1" />
        </div>
      ))}
    </div>
  );
};
