import { Suspense } from "react";
import { TimeTrackerClient } from "./_components/time-tracker-client";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

const TimeTrackerPage = async ({ params }: Props) => {
  const { organizationId } = await params;

  return (
    <div className="w-full">
      <Suspense fallback={<Skeleton className="w-full h-96 rounded-xl" />}>
        <TimeTrackerClient organizationId={organizationId} />
      </Suspense>
    </div>
  );
};

export default TimeTrackerPage;
