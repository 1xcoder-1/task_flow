import { Suspense } from "react";
import { ActivityList } from "./_components/activity-list";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ActivityPage = async ({ searchParams }: Props) => {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 min-w-0 space-y-4">
      <ActivityList page={page} />
    </div>
  );
};

export default ActivityPage;
