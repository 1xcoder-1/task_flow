"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getOrgStats } from "@/actions/get-org-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useOthers, ClientSideSuspense } from "@liveblocks/react/suspense";

export const AdminStats = () => {
  return (
    <ClientSideSuspense fallback={
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
      </div>
    }>
      <AdminStatsContent />
    </ClientSideSuspense>
  );
};

const AdminStatsContent = () => {
  const { organization, membership, isLoaded } = useOrganization();
  const others = useOthers();

  const { data, isLoading } = useQuery({
    queryKey: ["org-stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const res = await getOrgStats({ orgId: organization.id });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled: !!organization?.id && membership?.role === "org:admin",
    refetchInterval: 10000,
  });

  if (!isLoaded) {
    return (
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
      </div>
    );
  }

  if (!organization || membership?.role !== "org:admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
        <Skeleton className="h-[80px] w-[150px] rounded-lg" />
      </div>
    );
  }

  const activeUsers = 1 + others.length;
  const totalMembers = data?.totalMembers || 0;
  const offlineUsers = Math.max(0, totalMembers - activeUsers);

  return (
    <div className="mt-4 flex gap-4 bg-white p-4 rounded-xl border border-gray-200 w-full mr-4 md:mr-0 -ml-3 shadow-sm">
      <StatCard title="Total Members" value={totalMembers} />
      <StatCard title="Active Tasks" value={data?.activeTasks || 0} />
      <StatCard title="Active Users" value={activeUsers} />
      <StatCard title="Offline Users" value={offlineUsers} />
    </div>
  );
};

const StatCard = ({ title, value }: { title: string; value: number }) => {
  return (
    <div className="flex-1 border border-gray-200 rounded-lg px-6 py-4 bg-gray-50 text-gray-900 flex flex-col items-center justify-center min-w-[140px] shadow-sm h-32">
      <span className="text-sm font-medium mb-2 text-gray-500">{title}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  );
};
