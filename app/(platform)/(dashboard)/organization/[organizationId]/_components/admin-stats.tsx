"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getOrgStats } from "@/actions/get-org-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useOthers, useSelf } from "@liveblocks/react";
import { Users, UserCheck, UserX, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AdminStats = () => {
  const { membership, isLoaded } = useOrganization();

  if (!isLoaded || membership?.role !== "org:admin") {
    return null;
  }

  return <AdminStatsContent />;
};

const AdminStatsContent = () => {
  const { organization, membership, memberships, isLoaded } = useOrganization({
    memberships: { infinite: true, pageSize: 100 },
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
    enabled: !!organization?.id && membership?.role === "org:admin",
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (!isLoaded) {
    return (
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
      </div>
    );
  }

  if (!organization || membership?.role !== "org:admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
      </div>
    );
  }

  const memberMap = new Map(
    memberships?.data?.map((m) => [
      m.publicUserData?.userId,
      `${m.publicUserData?.firstName || ""} ${m.publicUserData?.lastName || ""}`.trim() || m.publicUserData?.identifier || "Member",
    ])
  );

  const activeMembers = Array.from(new Map<string, string>([
    ...(self ? [[self.id, (self.info?.name && self.info.name !== "User" ? self.info.name : null) || user?.fullName || user?.firstName || "You"] as [string, string]] : []),
    ...others.map((member) => [
      member.id,
      (member.info?.name && member.info.name !== "User" && member.info.name !== "Member" ? member.info.name : null) || memberMap.get(member.id) || "Member"
    ] as [string, string]),
  ]).entries()).map(([id, name]) => ({ id, name }));
  const activeUserIds = new Set(activeMembers.map((member) => member.id));
  const allMembers = memberships?.data?.map((member) => ({
    id: member.publicUserData?.userId || String(member.id),
    name: `${member.publicUserData?.firstName || ""} ${member.publicUserData?.lastName || ""}`.trim() || "Member",
  })) || [];
  const activeUsers = activeMembers.length;
  const totalMembers = organization.membersCount ?? data?.totalMembers ?? 0;
  const offlineUsers = Math.max(0, totalMembers - activeUsers);
  const offlineMembers = allMembers.filter((member) => !activeUserIds.has(member.id));

  return (
    <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {/* Active Users Card */}
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] transition-shadow duration-300 flex flex-col justify-between group min-h-[140px] text-left hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <span className="text-[11px] font-semibold text-emerald-800/70 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Active Users
              </span>
              <div className="p-2.5 bg-emerald-50/80 text-emerald-600 rounded-xl group-hover:bg-emerald-100/80 transition-colors">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between relative z-10">
              <span className="text-3xl sm:text-4xl font-bold text-emerald-950 tracking-tight">{activeUsers}</span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full border border-emerald-200/50">Online Now</span>
            </div>
            <span className="mt-3 text-xs text-emerald-700 relative z-10">Click to view users</span>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Active users ({activeUsers})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
            {activeMembers.length ? activeMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-950">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate">{member.name}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No active users right now.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Offline Users Card */}
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(100,116,139,0.1)] transition-shadow duration-300 flex flex-col justify-between group min-h-[140px] text-left hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-400/5 rounded-full blur-2xl group-hover:bg-slate-400/10 transition-colors duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Offline Users</span>
              <div className="p-2.5 bg-slate-50/80 text-slate-500 rounded-xl group-hover:bg-slate-100/80 transition-colors">
                <UserX className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between relative z-10">
              <span className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">{offlineUsers}</span>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/80">Away</span>
            </div>
            <span className="mt-3 text-xs text-slate-500 relative z-10">Click to view users</span>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Offline users ({offlineUsers})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
            {offlineMembers.length ? offlineMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-950">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                <span className="truncate">{member.name}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No offline users right now.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Total Members Card */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)] transition-shadow duration-300 flex flex-col justify-between group min-h-[140px]">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500" />
        <div className="flex items-start justify-between relative z-10">
          <span className="text-[11px] font-semibold text-blue-800/70 uppercase tracking-widest">
            Total Members
          </span>
          <div className="p-2.5 bg-blue-50/80 text-blue-600 rounded-xl group-hover:bg-blue-100/80 transition-colors">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between relative z-10">
          <span className="text-3xl sm:text-4xl font-bold text-blue-950 tracking-tight">
            {totalMembers}
          </span>
          <span className="text-[11px] font-medium text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-full border border-blue-200/50">
            Team Size
          </span>
        </div>
      </div>

      {/* Active Tasks Card */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(249,115,22,0.1)] transition-shadow duration-300 flex flex-col justify-between group min-h-[140px]">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors duration-500" />
        <div className="flex items-start justify-between relative z-10">
          <span className="text-[11px] font-semibold text-orange-800/70 uppercase tracking-widest">
            Active Tasks
          </span>
          <div className="p-2.5 bg-orange-50/80 text-orange-600 rounded-xl group-hover:bg-orange-100/80 transition-colors">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between relative z-10">
          <span className="text-3xl sm:text-4xl font-bold text-orange-950 tracking-tight">
            {data?.activeTasks || 0}
          </span>
          <span className="text-[11px] font-medium text-orange-700 bg-orange-100/50 px-2.5 py-1 rounded-full border border-orange-200/50">
            In Progress
          </span>
        </div>
      </div>
    </div>
  );
};
