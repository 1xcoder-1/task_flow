import { Suspense } from "react";

import { Separator } from "@/components/ui/separator";

import { Info } from "./_components/info";
import { AdminStats } from "./_components/admin-stats";
import { BoardList } from "./_components/board-list";
import { MemberTasksDashboard } from "./_components/member-tasks";
import { WelcomeBannerModal } from "@/components/welcome-banner-modal";

const OrganizationIdPage = async () => {
  return (
    <div className="w-full mb-20">
      <WelcomeBannerModal />
      <Info />
      <AdminStats />
      <MemberTasksDashboard />

      <Separator className="my-6 md:-ml-14 md:w-[calc(100%+3.5rem)]" />

      <div className="mt-4">
        <Suspense fallback={<BoardList.Skeleton />}>
          <BoardList />
        </Suspense>
      </div>
    </div>
  );
};

export default OrganizationIdPage;

