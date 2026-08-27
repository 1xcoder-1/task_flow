import { Suspense } from "react";

import { Separator } from "@/components/ui/separator";

import { Info } from "./_components/info";
import { AdminStats } from "./_components/admin-stats";
import { BoardList } from "./_components/board-list";

const OrganizationIdPage = async () => {
  return (
    <div className="w-full mb-20">
      <Info />
      <AdminStats />

      <Separator className="my-4 md:-ml-14 md:w-[calc(100%+3.5rem)]" />

      <div className="mt-4">
        <Suspense fallback={<BoardList.Skeleton />}>
          <BoardList />
        </Suspense>
      </div>
    </div>
  );
};

export default OrganizationIdPage;
