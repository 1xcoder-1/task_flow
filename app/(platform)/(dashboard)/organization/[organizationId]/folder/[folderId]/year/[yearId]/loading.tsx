import { Skeleton } from "@/components/ui/skeleton";
import { Folder } from "lucide-react";

export default function YearLoading() {
  return (
    <div className="w-full mb-20">
      <Skeleton className="h-8 w-44 rounded-full mb-4 ml-1" />
      <div className="space-y-4">
        <div className="flex items-center font-semibold text-lg text-neutral-700">
          <Folder className="h-6 w-6 mr-2" />
          Month Folders
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <Skeleton className="aspect-square h-full w-full rounded-xl" />
          <Skeleton className="aspect-square h-full w-full rounded-xl" />
          <Skeleton className="aspect-square h-full w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
