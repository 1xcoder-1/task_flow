"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getOrgStats } from "@/actions/get-org-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useOthers, ClientSideSuspense } from "@liveblocks/react/suspense";
import { Users, UserCheck, UserX, Zap, Signal } from "lucide-react";

export const AdminStats = () => {
  const { membership, isLoaded } = useOrganization();

  if (!isLoaded || membership?.role !== "org:admin") {
    return null;
  }

  return (
    <ClientSideSuspense
      fallback={
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      }
    >
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
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  if (!organization || membership?.role !== "org:admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  const activeUsers = 1 + others.length;
  const totalMembers = data?.totalMembers || 0;
  const offlineUsers = Math.max(0, totalMembers - activeUsers);

  return (
    <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full">
      {/* Active Users Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Active Users
          </span>
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
            {activeUsers}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
            Online Now
          </span>
        </div>
      </div>

      {/* Offline Users Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100/80 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Offline Users
          </span>
          <div className="p-2 bg-slate-200/80 text-slate-500 rounded-xl">
            <UserX className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {offlineUsers}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full border border-slate-300/60">
            Away
          </span>
        </div>
      </div>

      {/* Total Members Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            Total Members
          </span>
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-950">
            {totalMembers}
          </span>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
            Team Size
          </span>
        </div>
      </div>

      {/* Active Tasks Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50/80 border border-orange-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
            Active Tasks
          </span>
          <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-orange-950">
            {data?.activeTasks || 0}
          </span>
          <span className="text-[11px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200">
            In Progress
          </span>
        </div>
      </div>
    </div>
  );
};
