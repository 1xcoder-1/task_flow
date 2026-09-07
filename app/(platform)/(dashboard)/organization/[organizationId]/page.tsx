import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Separator } from "@/components/ui/separator";

import { Info } from "./_components/info";
import { AdminStats } from "./_components/admin-stats";
import { BoardList } from "./_components/board-list";
import { MemberTasksDashboard } from "./_components/member-tasks";
import { WelcomeBannerModal } from "@/components/welcome-banner-modal";
import { getOrgStats } from "@/actions/get-org-stats";

import { getUserTasks } from "@/actions/get-user-tasks";

interface OrganizationIdPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

const OrganizationIdPage = async ({ params }: OrganizationIdPageProps) => {
  const { organizationId } = await params;
  const [{ orgRole }, statsRes, userTasksRes] = await Promise.all([
    auth(),
    getOrgStats({ orgId: organizationId }),
    getUserTasks(organizationId),
  ]);
  const isAdmin = orgRole === "org:admin";
  const initialStats = statsRes?.data || undefined;
  const initialUserTasks = userTasksRes?.data || undefined;

  return (
    <div className="w-full mb-20">
      <WelcomeBannerModal />
      <Info />
      {isAdmin ? (
        <AdminStats initialData={initialStats} />
      ) : (
        <MemberTasksDashboard initialData={initialUserTasks} />
      )}

      <Separator className="my-6 md:-ml-14 md:w-[calc(100%+3.5rem)]" />

      <div className="mt-4">
        <Suspense fallback={<BoardList.Skeleton />}>
          <BoardList orgId={organizationId} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </div>
  );
};

export default OrganizationIdPage;
