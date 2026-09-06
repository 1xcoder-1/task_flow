import { Info } from "./_components/info";
import { BoardList } from "./_components/board-list";
import { Separator } from "@/components/ui/separator";

export default function OrganizationLoading() {
  return (
    <div className="w-full mb-20">
      <Info.Skeleton />
      <Separator className="my-6 md:-ml-14 md:w-[calc(100%+3.5rem)]" />
      <div className="mt-4">
        <BoardList.Skeleton />
      </div>
    </div>
  );
}
