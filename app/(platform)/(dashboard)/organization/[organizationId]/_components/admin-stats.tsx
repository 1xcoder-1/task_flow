"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getOrgStats } from "@/actions/get-org-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useOthers, useSelf } from "@liveblocks/react";
import { Users, UserCheck, UserX, Folder, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useMemo } from "react";

export const AdminStats = ({ initialData }: { initialData?: any }) => {
  const { membership, isLoaded } = useOrganization();

  if (isLoaded && membership?.role !== "org:admin") {
    return null;
  }

  return <AdminStatsContent initialData={initialData} />;
};

const AdminStatsSkeleton = () => (
  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
    <Skeleton className="h-28 rounded-xl" />
    <Skeleton className="h-28 rounded-xl" />
    <Skeleton className="h-28 rounded-xl" />
    <Skeleton className="h-28 rounded-xl" />
  </div>
);

function useActiveAdminMembers(memberships: any, user: any, self: any, others: any, organization: any, data: any) {
  const memberMap = new Map(
    memberships?.data?.map((m: any) => [
      m.publicUserData?.userId,
      `${m.publicUserData?.firstName || ""} ${m.publicUserData?.lastName || ""}`.trim() || m.publicUserData?.identifier || "Member",
    ])
  );

  const activeMembers = Array.from(new Map<string, string>([
    ...(self ? [[self.id, (self.info?.name && self.info.name !== "User" ? self.info.name : null) || user?.fullName || user?.firstName || "You"] as [string, string]] : []),
    ...others.map((member: any) => [
      member.id,
      (member.info?.name && member.info.name !== "User" && member.info.name !== "Member" ? member.info.name : null) || memberMap.get(member.id) || "Member"
    ] as [string, string]),
  ]).entries()).map(([id, name]) => ({ id, name }));

  const activeUserIds = new Set(activeMembers.map((m) => m.id));
  const allMembers = memberships?.data?.map((m: any) => ({
    id: m.publicUserData?.userId || String(m.id),
    name: `${m.publicUserData?.firstName || ""} ${m.publicUserData?.lastName || ""}`.trim() || "Member",
  })) || [];

  const activeUsers = activeMembers.length;
  const totalMembers = organization?.membersCount ?? data?.totalMembers ?? 0;
  const offlineUsers = Math.max(0, totalMembers - activeUsers);
  const offlineMembers = allMembers.filter((m: any) => !activeUserIds.has(m.id));

  return { activeMembers, activeUsers, totalMembers, offlineUsers, offlineMembers };
}

const AdminStatsContent = ({ initialData }: { initialData?: any }) => {
  const { organization, membership, memberships, isLoaded } = useOrganization({
    memberships: { infinite: true },
  });
  const { user } = useUser();
  const self = useSelf();
  const others = useOthers();

  const { data, isLoading } = useQuery({
    queryKey: ["org-stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const res = await getOrgStats({ orgId: organization.id });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    initialData: initialData || undefined,
    enabled: !!organization?.id && membership?.role === "org:admin",
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const { activeMembers, activeUsers, totalMembers, offlineUsers, offlineMembers } = useMemo(
    () => useActiveAdminMembers(memberships, user, self, others, organization, data || initialData),
    [memberships, user, self, others, organization, data, initialData]
  );

  if ((!isLoaded && !initialData) || (isLoading && !data && !initialData)) {
    return <AdminStatsSkeleton />;
  }

  if (isLoaded && (!organization || membership?.role !== "org:admin")) {
    return null;
  }

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {/* Active Users Card */}
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="bg-white p-4.5 sm:p-5 rounded-xl border border-gray-200 shadow-2xs text-left hover:border-gray-300 transition focus-visible:outline-none flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Users</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold text-emerald-600 mt-2">{activeUsers}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Online now</p>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">Active users ({activeUsers})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
            {activeMembers.length ? activeMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-sm font-medium text-emerald-950">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate">{member.name}</span>
              </div>
            )) : <p className="text-sm text-slate-500">No active users right now.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Offline Users Card */}
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="bg-white p-4.5 sm:p-5 rounded-xl border border-gray-200 shadow-2xs text-left hover:border-gray-300 transition focus-visible:outline-none flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Offline Users</span>
              <span className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
                <UserX className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold text-slate-700 mt-2">{offlineUsers}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Offline</p>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">Offline users ({offlineUsers})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
            {offlineMembers.length ? offlineMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
                <span className="truncate">{member.name}</span>
              </div>
            )) : <p className="text-sm text-slate-500">No offline users right now.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Total Members */}
      <div className="bg-white p-4.5 sm:p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between min-h-[110px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Members</span>
          <span className="p-1.5 bg-sky-50 text-sky-600 rounded-md">
            <Users className="h-4 w-4" />
          </span>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-2">{totalMembers}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Workspace team</p>
        </div>
      </div>

      {/* Total Teams */}
      <div className="bg-white p-4.5 sm:p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between min-h-[110px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Teams</span>
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
            <Folder className="h-4 w-4" />
          </span>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-semibold text-indigo-600 mt-2">{data?.totalTeams ?? 0}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Active team folders</p>
        </div>
      </div>
    </div>
  );
};
