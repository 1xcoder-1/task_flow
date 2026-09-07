import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { DailyChartsClient } from "./_components/daily-charts-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getDailyAnalyticsData } from "@/lib/get-daily-analytics";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

const DailyChartsPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const { userId, orgRole } = await auth();

  let initialData = null;
  if (userId) {
    try {
      initialData = await getDailyAnalyticsData({
        orgId: organizationId,
        userId,
        orgRole,
        range: "daily",
        targetUserId: "all",
      });
    } catch (err) {
      console.error("SSR analytics prefetch error:", err);
    }
  }

  return (
    <div className="w-full">
      <Suspense fallback={<Skeleton className="w-full h-96 rounded-xl" />}>
        <DailyChartsClient organizationId={organizationId} initialData={initialData} />
      </Suspense>
    </div>
  );
};

export default DailyChartsPage;
