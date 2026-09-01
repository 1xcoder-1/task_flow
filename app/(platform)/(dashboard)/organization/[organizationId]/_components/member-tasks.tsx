"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserTasks } from "@/actions/get-user-tasks";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Layers, Sparkles, TrendingUp } from "lucide-react";

export const MemberTasksDashboard = () => {
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  const { user } = useUser();

  const isAdmin = membership?.role === "org:admin";

  const { data: cardsResponse, isLoading } = useQuery({
    queryKey: ["user-tasks", organization?.id, user?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const res = await getUserTasks(organization.id);
      if (res.error) throw new Error(res.error);
      return res.data || [];
    },
    enabled: !!organization?.id && !!user?.id && !isAdmin,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (!isOrgLoaded) {
    return null;
  }

  // Admins do not see the Member Assigned Tasks section
  if (isAdmin) {
    return null;
  }

  const cards = cardsResponse || [];

  if (isLoading) {
    return (
      <div className="mt-2 space-y-4">
        <Skeleton className="h-6 w-48 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isCardCompleted = (c: any) => {
    if (c.status === "DONE") return true;
    const listTitle = c.list?.title?.toLowerCase() || "";
    return listTitle.includes("done") || listTitle.includes("complete");
  };

  const isCardOverdue = (c: any) => {
    if (!c.dueDate || isCardCompleted(c)) return false;
    return new Date(c.dueDate) < new Date();
  };

  // Filter categories for the logged-in user's assigned tasks
  const pendingCards = cards.filter((c) => !isCardCompleted(c) && !isCardOverdue(c));
  const completedCards = cards.filter((c) => isCardCompleted(c));

  // Continuously updated real-time Work Completion Percentage
  const totalAssignedTasks = cards.length;
  const completionPercentage =
    totalAssignedTasks > 0
      ? Math.round((completedCards.length / totalAssignedTasks) * 100)
      : 0;

  return (
    <div className="mt-2 space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-x-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Your Tasks Overview
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Personal real-time task status overview in {organization?.name}
        </p>
      </div>

      {/* 4 Cool Simple Member Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Pending Tasks */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)] transition-all duration-300 flex flex-col justify-between group min-h-[140px]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-semibold text-amber-800/70 uppercase tracking-widest">
              Pending Tasks
            </span>
            <div className="p-2.5 bg-amber-50/80 text-amber-600 rounded-xl group-hover:bg-amber-100/80 transition-colors">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span className="text-3xl sm:text-4xl font-bold text-amber-950 tracking-tight">
              {pendingCards.length}
            </span>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-full border border-amber-200/50">
              To Do
            </span>
          </div>
        </div>

        {/* Total Assigned */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)] transition-all duration-300 flex flex-col justify-between group min-h-[140px]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-semibold text-blue-800/70 uppercase tracking-widest">
              Total Assigned
            </span>
            <div className="p-2.5 bg-blue-50/80 text-blue-600 rounded-xl group-hover:bg-blue-100/80 transition-colors">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span className="text-3xl sm:text-4xl font-bold text-blue-950 tracking-tight">
              {totalAssignedTasks}
            </span>
            <span className="text-[11px] font-medium text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-full border border-blue-200/50">
              Total
            </span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col justify-between group min-h-[140px]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-semibold text-emerald-800/70 uppercase tracking-widest">
              Completed Tasks
            </span>
            <div className="p-2.5 bg-emerald-50/80 text-emerald-600 rounded-xl group-hover:bg-emerald-100/80 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-950 tracking-tight">
              {completedCards.length}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full border border-emerald-200/50">
              Finished
            </span>
          </div>
        </div>

        {/* Work Completion % */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(168,85,247,0.1)] transition-all duration-300 flex flex-col justify-between group min-h-[140px]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-semibold text-purple-800/70 uppercase tracking-widest">
              Work Completion
            </span>
            <div className="p-2.5 bg-purple-50/80 text-purple-600 rounded-xl group-hover:bg-purple-100/80 transition-colors">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span className="text-3xl sm:text-4xl font-bold text-purple-950 tracking-tight">
              {completionPercentage}%
            </span>
            <span className="text-[11px] font-medium text-purple-700 bg-purple-100/50 px-2.5 py-1 rounded-full border border-purple-200/50">
              Progress
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
