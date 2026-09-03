"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Clock,
  ListFilter,
  Users,
  ShieldCheck,
  GitCompare,
  ArrowRightLeft,
  CheckCircle2,
  UserCheck,
  Trophy
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type ChartRange = "daily" | "overall";

interface MemberStat {
  userId: string;
  userName: string;
  userImage?: string;
  isAdmin?: boolean;
  joinedAt?: string;
  assignedCount: number;
  activeCount: number;
  completedCount: number;
  pendingCount: number;
}

interface MemberDayBreakdown {
  userName: string;
  assigned: number;
  active: number;
  completed: number;
}

interface DailyTrendItem {
  day: string;
  date: string;
  assigned: number;
  active: number;
  completed: number;
  members?: MemberDayBreakdown[];
}

interface CompareTrendItem {
  day: string;
  date: string;
  totalA: number;
  totalB: number;
  completedA: number;
  completedB: number;
  activeA: number;
  activeB: number;
  pendingA?: number;
  pendingB?: number;
}

interface DailyChartsClientProps {
  organizationId: string;
}

// Client-only dynamic imports for Recharts components to eliminate SSR chunk errors
const DailyOverviewChart = dynamic(
  () => import("./daily-charts-renderers").then((m) => m.DailyOverviewChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[440px] w-full rounded-xl" />,
  }
);

const CompareTrendChart = dynamic(
  () => import("./daily-charts-renderers").then((m) => m.CompareTrendChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-xl" />,
  }
);

function localDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const DailyChartsClient = ({ organizationId }: DailyChartsClientProps) => {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<ChartRange>("daily");
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>("all");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareUserId, setCompareUserId] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (range === "daily") {
      setSelectedTargetUserId("all");
    }
  }, [range]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timer = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["daily-activity"] });
    }, nextMidnight.getTime() - now.getTime() + 200);
    return () => window.clearTimeout(timer);
  }, [queryClient]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      "daily-activity",
      organizationId,
      selectedTargetUserId,
      isCompareMode,
      compareUserId,
      range,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        orgId: organizationId,
        targetUserId: selectedTargetUserId,
        range,
        localDate: localDateStr(),
        tzOffset: String(new Date().getTimezoneOffset()),
      });
      if (isCompareMode && compareUserId) params.set("compareUserId", compareUserId);
      const res = await fetch(`/api/analytics/daily-activity?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      if (!json.success) throw new Error("Failed to load analytics");
      return json;
    },
    enabled: hasMounted,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load analytics.");
  }, [isError]);

  useEffect(() => {
    const membersList: MemberStat[] = data?.allMembers || [];
    if (membersList.length > 1 && !compareUserId) {
      const secondMember = membersList.find((m) => m.userId !== selectedTargetUserId);
      if (secondMember) setCompareUserId(secondMember.userId);
    }
  }, [data, compareUserId, selectedTargetUserId]);

  const isAdmin = data?.isAdmin || false;
  const allMembers: MemberStat[] = data?.allMembers || [];
  const dailyTrends: DailyTrendItem[] = data?.dailyTrends || [];
  const compareTrends: CompareTrendItem[] = data?.compareTrends || [];
  const metrics = {
    totalAssigned: data?.metrics?.totalAssigned || 0,
    totalActive: data?.metrics?.totalActive || 0,
    totalCompleted: data?.metrics?.totalCompleted || 0,
    totalPending: Math.max(0, (data?.metrics?.totalAssigned || 0) - (data?.metrics?.totalCompleted || 0) - (data?.metrics?.totalActive || 0)),
    totalMembers: allMembers.length,
  };
  const showSkeleton = !data;

  const targetMemberObj = allMembers.find((m) => m.userId === selectedTargetUserId);
  const compareMemberObj = allMembers.find((m) => m.userId === compareUserId);

  const cleanNameA = targetMemberObj?.userName?.replace(/\s*\(Admin\)/g, "") || "Person A";
  const cleanNameB = compareMemberObj?.userName?.replace(/\s*\(Admin\)/g, "") || "Person B";

  const totalCompletedA = targetMemberObj?.completedCount || 0;
  const totalCompletedB = compareMemberObj?.completedCount || 0;
  const totalActiveA = targetMemberObj?.activeCount || 0;
  const totalActiveB = compareMemberObj?.activeCount || 0;
  const totalAssignedA = targetMemberObj?.assignedCount || 0;
  const totalAssignedB = compareMemberObj?.assignedCount || 0;
  const totalPendingA = Math.max(0, totalAssignedA - totalCompletedA - totalActiveA);
  const totalPendingB = Math.max(0, totalAssignedB - totalCompletedB - totalActiveB);

  const scoreDiff = totalCompletedA - totalCompletedB;
  let scoreBadgeText = "Equal Completion";
  if (scoreDiff > 0) scoreBadgeText = `${cleanNameA} completed +${scoreDiff} more tasks`;
  else if (scoreDiff < 0) scoreBadgeText = `${cleanNameB} completed +${Math.abs(scoreDiff)} more tasks`;

  return (
    <div className="w-full min-w-0 space-y-5 p-2 md:p-4 max-w-6xl mx-auto text-slate-800 relative">
      {/* Global CSS for Chart Click Outlines & Custom Thin Light Scrollbars */}
      <style jsx global>{`
        .recharts-wrapper,
        .recharts-wrapper *,
        .recharts-surface,
        .recharts-surface * {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Hide scrollbars visually on chart wrappers and SVG containers while keeping scroll functionality working */
        .recharts-wrapper ::-webkit-scrollbar,
        .recharts-responsive-container ::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }

        .recharts-wrapper,
        .recharts-responsive-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        /* Custom Thin Light Scrollbar specifically for Hover Tooltip lists */
        .custom-thin-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
          display: block !important;
        }
        .custom-thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-thin-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3.5 w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {isAdmin
                  ? (range === "daily" ? "Daily Performance Analytics" : "Overall Performance Analytics")
                  : (range === "daily" ? "My Daily Analytics" : "My Overall Analytics")}
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  <ShieldCheck className="h-3 w-3 mr-1 text-slate-600" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 hidden md:block">
              {range === "daily"
                ? (isAdmin
                  ? "Today’s team stats reset at midnight. Switch to Overall for join-date history or click on the score."
                  : "Your today stats reset at midnight. Switch to Overall for join-date history or click on the score.")
                : (isAdmin
                  ? "All time team stats from each member’s join date through today, formatted across full multi-year history."
                  : "Your stats from the day you joined this workspace through today, formatted across full multi-year history.")}
            </p>
          </div>
        </div>

        {/* Controls Container in One Row */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Daily / Overall Range Switcher */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setRange("daily")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${range === "daily" ? "bg-sky-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setRange("overall")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${range === "overall" ? "bg-sky-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              Overall
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <label htmlFor="admin-member-dropdown-select" className="text-xs font-medium text-slate-600 shrink-0 hidden sm:inline-block"></label>
                <select
                  id="admin-member-dropdown-select"
                  aria-label="Select member"
                  value={selectedTargetUserId}
                  onChange={(e) => setSelectedTargetUserId(e.target.value)}
                  className="bg-white border border-gray-300 text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs h-7 max-w-[150px] truncate"
                >
                  <option value="all">👥 All Members ({allMembers.length})</option>
                  {range !== "daily" && allMembers.map((m) => {
                    const isMemberAdmin = m.isAdmin || m.userName.includes("(Admin)");
                    const cleanName = m.userName.replace(/\s*\(Admin\)/g, "").trim();
                    const icon = isMemberAdmin ? "👑" : "👤";

                    return (
                      <option key={m.userId} value={m.userId}>
                        {icon} {cleanName} ({m.assignedCount})
                      </option>
                    );
                  })}
                </select>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  if (!isCompareMode && allMembers.length > 1) {
                    const personA = selectedTargetUserId === "all" ? allMembers[0].userId : selectedTargetUserId;
                    const personB = allMembers.find((m) => m.userId !== personA)?.userId || allMembers[1]?.userId;
                    setSelectedTargetUserId(personA);
                    setCompareUserId(personB || "");
                  }
                  setIsCompareMode(!isCompareMode);
                }}
                className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-colors ${isCompareMode
                  ? "bg-sky-600 hover:bg-sky-700 text-white shadow-2xs"
                  : "bg-white border border-gray-300 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <GitCompare className={`h-3.5 w-3.5 mr-1 ${isCompareMode ? "text-white" : "text-slate-700"}`} />
                {isCompareMode ? "Exit Compare" : "Compare"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN COMPARISON BAR */}
      {isAdmin && isCompareMode && (
        <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-800">Member Comparison Mode</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-600 font-medium">Person A:</span>
              <select
                aria-label="Select Person A"
                value={selectedTargetUserId}
                onChange={(e) => setSelectedTargetUserId(e.target.value)}
                className="bg-white border border-gray-300 text-xs font-medium text-slate-800 rounded-md px-2 py-1 max-w-[150px] truncate cursor-pointer"
              >
                {allMembers.map((m) => {
                  const isMemberAdmin = m.isAdmin || m.userName.includes("(Admin)");
                  const cleanName = m.userName.replace(/\s*\(Admin\)/g, "").trim();
                  const icon = isMemberAdmin ? "👑" : "👤";
                  return (
                    <option key={m.userId} value={m.userId}>{icon} {cleanName}</option>
                  );
                })}
              </select>
            </div>

            <span className="text-xs font-medium text-slate-400">VS</span>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-600 font-medium">Person B:</span>
              <select
                aria-label="Select Person B"
                value={compareUserId}
                onChange={(e) => setCompareUserId(e.target.value)}
                className="bg-white border border-gray-300 text-xs font-medium text-slate-800 rounded-md px-2 py-1 max-w-[150px] truncate cursor-pointer"
              >
                {allMembers.map((m) => {
                  const isMemberAdmin = m.isAdmin || m.userName.includes("(Admin)");
                  const cleanName = m.userName.replace(/\s*\(Admin\)/g, "").trim();
                  const icon = isMemberAdmin ? "👑" : "👤";
                  return (
                    <option key={m.userId} value={m.userId}>{icon} {cleanName}</option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* CLEAN UNIFORM KPI CARDS (Only shown when NOT in compare mode) */}
      {!isCompareMode && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Tasks */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Tasks</span>
              <span className="p-1 bg-sky-50 text-sky-600 rounded">
                <ListFilter className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 min-h-[32px] flex items-center">
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 rounded-md" />
              ) : (
                <p className="text-2xl font-semibold text-slate-800">
                  {metrics.totalCompleted + metrics.totalActive + metrics.totalPending}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {range === "daily" ? "Done + In Progress + Pending today" : "Done + In Progress + Pending all time"}
            </p>
          </div>

          {/* Card 2: Completed Tasks */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Completed Tasks</span>
              <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 min-h-[32px] flex items-center">
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 rounded-md" />
              ) : (
                <p className="text-2xl font-semibold text-emerald-600">{metrics.totalCompleted}</p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {range === "daily" ? "Finished today" : "Finished all time"}
            </p>
          </div>

          {/* Card 3: Pending Tasks */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Tasks</span>
              <span className="p-1 bg-amber-50 text-amber-600 rounded">
                <Clock className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 min-h-[32px] flex items-center">
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 rounded-md" />
              ) : (
                <p className="text-2xl font-semibold text-amber-600">{metrics.totalPending}</p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {range === "daily" ? "Pending today" : "Pending right now"}
            </p>
          </div>

          {/* Card 4: In Progress Tasks */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">In Progress Tasks</span>
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 min-h-[32px] flex items-center">
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 rounded-md" />
              ) : (
                <p className="text-2xl font-semibold text-indigo-600">{metrics.totalActive}</p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {range === "daily" ? "In progress today" : "In progress right now"}
            </p>
          </div>
        </div>
      )}

      {/* ULTRA-SIMPLE COMPARISON SECTION WITH SCORECARD HEADER & VISIBLE 2-LINE TREND CHART */}
      {isAdmin && isCompareMode ? (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4 min-w-0 w-full">
          {/* Comparison Scorecard Header */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Person A Summary */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-200">
                {cleanNameA.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">{cleanNameA}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Total Tasks: <span className="font-bold text-sky-700">{totalCompletedA + totalActiveA + totalPendingA}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                  <span className="text-emerald-600 font-semibold">{totalCompletedA} Completed</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold">{totalActiveA} Active</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">{totalPendingA} Pending</span>
                </div>
              </div>
            </div>

            {/* Scorecard Badge Result */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-2xs text-xs font-semibold text-slate-700">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>{scoreBadgeText}</span>
            </div>

            {/* Person B Summary */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{cleanNameB}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Total Tasks: <span className="font-bold text-purple-700">{totalCompletedB + totalActiveB + totalPendingB}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap justify-end">
                  <span className="text-emerald-600 font-semibold">{totalCompletedB} Completed</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold">{totalActiveB} Active</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">{totalPendingB} Pending</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-200">
                {cleanNameB.charAt(0)}
              </div>
            </div>
          </div>

          {/* Guaranteed Visible Smooth 2-Line Area Chart (Dynamically Imported) */}
          {showSkeleton ? (
            <Skeleton className="h-[420px] w-full rounded-xl" />
          ) : (
            <CompareTrendChart
              compareTrends={compareTrends}
              cleanNameA={cleanNameA}
              cleanNameB={cleanNameB}
            />
          )}
        </div>
      ) : (
        /* MAIN CRYSTAL-CLEAR 7-DAY PERFORMANCE TREND CHART (Dynamically Imported) */
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-2.5 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  {range === "daily" ? "Daily Tasks Overview" : "Join date → today"}
                  {selectedTargetUserId !== "all" && targetMemberObj ? ` (${cleanNameA})` : ""}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {range === "daily"
                  ? "Each day is its own count and resets at midnight"
                  : "Every day from when this person joined the workspace through today"}
              </p>
            </div>
            {selectedTargetUserId === "all" && (
              <span className="text-[11px] text-slate-400 italic">
                Hover chart to view member names
              </span>
            )}
          </div>

          {showSkeleton ? (
            <Skeleton className="h-[410px] w-full rounded-xl" />
          ) : (
            <DailyOverviewChart
              dailyTrends={dailyTrends}
              allMembers={allMembers}
              selectedTargetUserId={selectedTargetUserId}
            />
          )}
        </div>
      )}
    </div>
  );
};
