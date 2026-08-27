import { Suspense } from "react";

import { Separator } from "@/components/ui/separator";

import { Info } from "../_components/info";
import { ActivityList } from "./_components/activity-list";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ActivityPage = async ({ searchParams }: Props) => {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;

  return (
    <div className="w-full">
      <Info />
      <Separator className="my-2" />
      <Suspense fallback={<ActivityList.Skeleton />}>
        <ActivityList page={page} />
      </Suspense>
    </div>
  );
};

export default ActivityPage;
