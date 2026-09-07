"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserTasks } from "@/actions/get-user-tasks";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";

const isCardCompleted = (c: any) => {
  if (c.status === "DONE") return true;
  const listTitle = c.list?.title?.toLowerCase() || "";
  return listTitle.includes("done") || listTitle.includes("complete");
};

const isCardOverdue = (c: any) => {
  if (!c.dueDate || isCardCompleted(c)) return false;
  return new Date(c.dueDate) < new Date();
};

import { useMemo } from "react";

export const MemberTasksDashboard = ({ initialData }: { initialData?: any[] | null }) => {
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
    initialData: initialData || undefined,
    enabled: !!organization?.id && !!user?.id && !isAdmin,
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  if (isOrgLoaded && isAdmin) {
    return null;
  }

  const cards = cardsResponse || initialData || [];

  const { pendingCards, completedCards, totalAssignedTasks, completionPercentage } = useMemo(() => {
    const pending = cards.filter((c: any) => !isCardCompleted(c) && !isCardOverdue(c));
    const completed = cards.filter((c: any) => isCardCompleted(c));
    const total = cards.length;
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    return {
      pendingCards: pending,
      completedCards: completed,
      totalAssignedTasks: total,
      completionPercentage: rate,
    };
  }, [cards]);

  if (!cards.length && ((!isOrgLoaded && !initialData) || (isLoading && !initialData))) {
    return (
      <div className="mt-4 space-y-3">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-600" />
          Your Tasks Overview
        </h2>
        <p className="text-xs text-slate-500">
          Personal real-time task status in {organization?.name}
        </p>
      </div>

      {/* Clean Light Member Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Pending Tasks */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Tasks</span>
            <span className="p-1 bg-amber-50 text-amber-600 rounded">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{pendingCards.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">To Do</p>
        </div>

        {/* Total Assigned */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Assigned</span>
            <span className="p-1 bg-sky-50 text-sky-600 rounded">
              <Layers className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalAssignedTasks}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned to you</p>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed Tasks</span>
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{completedCards.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Finished</p>
        </div>

        {/* Work Completion */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completion Rate</span>
            <span className="p-1 bg-slate-100 text-slate-600 rounded">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{completionPercentage}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Overall rate</p>
        </div>
      </div>
    </div>
  );
};
