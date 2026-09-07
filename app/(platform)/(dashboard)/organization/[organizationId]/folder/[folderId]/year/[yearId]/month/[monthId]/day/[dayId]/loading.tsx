import { Skeleton } from "@/components/ui/skeleton";
import { User2 } from "lucide-react";

export default function DayLoading() {
  return (
    <div className="w-full mb-20">
      <Skeleton className="h-8 w-44 rounded-full mb-4 ml-1" />
      <div className="space-y-4">
        <div className="flex items-center font-semibold text-lg text-neutral-700">
          <User2 className="h-6 w-6 mr-2" />
          Your Boards
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <Skeleton className="aspect-video h-full w-full rounded-xl" />
          <Skeleton className="aspect-video h-full w-full rounded-xl" />
          <Skeleton className="aspect-video h-full w-full rounded-xl" />
          <Skeleton className="aspect-video h-full w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
