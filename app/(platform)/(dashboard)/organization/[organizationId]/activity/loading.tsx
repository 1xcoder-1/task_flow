import { ActivityList } from "./_components/activity-list";

export default function ActivityLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 min-w-0 space-y-4">
      <ActivityList.Skeleton />
    </div>
  );
}
