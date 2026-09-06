import { YearFolderList } from "./_components/year-folder-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function FolderLoading() {
  return (
    <div className="w-full mb-20">
      <div className="flex items-center space-x-2 mb-4">
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>
      <div className="mt-4">
        <YearFolderList.Skeleton />
      </div>
    </div>
  );
}
