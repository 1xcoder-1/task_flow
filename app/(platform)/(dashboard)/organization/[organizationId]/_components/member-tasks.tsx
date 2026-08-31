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
    refetchInterval: 5000,
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
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950">
              {pendingCards.length}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
              To Do
            </span>
          </div>
        </div>

        {/* Total Assigned */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50/70 border border-sky-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-950">
              {totalAssignedTasks}
            </span>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
              Total
            </span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Completed Tasks
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
              {completedCards.length}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
              Finished
            </span>
          </div>
        </div>

        {/* Work Completion % */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50/70 border border-purple-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
              Work Completion
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-950">
              {completionPercentage}%
            </span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
              Progress
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
