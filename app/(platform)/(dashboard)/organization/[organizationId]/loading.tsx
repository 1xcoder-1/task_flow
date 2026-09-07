import { BoardList } from "./_components/board-list";
import { Separator } from "@/components/ui/separator";

export default function OrganizationLoading() {
  return (
    <div className="w-full mb-20">
      <div className="h-6" />
      <Separator className="my-6 md:-ml-14 md:w-[calc(100%+3.5rem)]" />
      <div className="mt-4">
        <BoardList.Skeleton />
      </div>
    </div>
  );
}
