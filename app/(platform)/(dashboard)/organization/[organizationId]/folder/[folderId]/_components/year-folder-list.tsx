import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Folder } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { WindowsFolderCard } from "@/components/ui/windows-folder-card";

// Note: You will need to build FormGenericFolderPopover if you want a creation popover,
// but for now we'll just put a placeholder button or we can build the popover.
import { FormGenericFolderPopover } from "@/components/form/form-generic-folder-popover";
import { NestedFolderOptionsModal } from "@/components/modals/nested-folder-options-modal";

interface YearFolderListProps {
  folderId: string;
}

const getYearFolders = unstable_cache(
  async (folderId: string) => {
    return (db.yearFolder as any).findMany({
      where: { folderId, isArchived: false },
      orderBy: { createdAt: "desc" },
    });
  },
  ["year-folders"],
  { revalidate: 5, tags: ["folders"] }
);

export const YearFolderList = async ({ folderId }: YearFolderListProps) => {
  const { orgId } = await auth();

  if (!orgId) return redirect("/select-org");

  const yearFolders = await getYearFolders(folderId);

  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
        <Folder className="h-6 w-6 mr-2" />
        Year Folders
      </div>

      <div className="flex flex-wrap gap-3 -ml-2 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-h-[calc(100vh-200px)] p-1">
        {yearFolders.map((yearFolder: any) => (
          <WindowsFolderCard
            key={yearFolder.id}
            href={`/organization/${orgId}/folder/${folderId}/year/${yearFolder.id}`}
            title={yearFolder.title}
            optionsMenu={<NestedFolderOptionsModal folder={{ id: yearFolder.id, title: yearFolder.title }} type="year" />}
          />
        ))}
        <FormGenericFolderPopover type="year" parentId={folderId} sideOffset={10} side="right">
          <div className="group flex flex-col w-40 items-center">
            <div
              aria-label="Create Year Folder"
              role="button"
              className="w-full rounded-md hover:bg-black/5 p-1 pb-1 transition flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="relative aspect-square w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center">
                <Folder className="h-20 w-20 text-blue-400 drop-shadow-sm opacity-50" strokeWidth={1} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-x-1 pt-1 overflow-hidden w-full px-1">
              <p className="font-medium text-sm text-neutral-600 truncate px-1.5 py-0.5 text-center max-w-[80%]">
                Create Year
              </p>
            </div>
          </div>
        </FormGenericFolderPopover>
      </div>
    </div>
  );
};

YearFolderList.Skeleton = function SkeletonYearFolderList() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      <Skeleton className="aspect-square h-full w-full p-2" />
      <Skeleton className="aspect-square h-full w-full p-2" />
      <Skeleton className="aspect-square h-full w-full p-2" />
    </div>
  );
};
