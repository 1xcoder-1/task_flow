import { Suspense } from "react";
import { DailyChartsClient } from "./_components/daily-charts-client";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

const DailyChartsPage = async ({ params }: Props) => {
  const { organizationId } = await params;

  return (
    <div className="w-full">
      <Suspense fallback={<Skeleton className="w-full h-96 rounded-xl" />}>
        <DailyChartsClient organizationId={organizationId} />
      </Suspense>
    </div>
  );
};

export default DailyChartsPage;
