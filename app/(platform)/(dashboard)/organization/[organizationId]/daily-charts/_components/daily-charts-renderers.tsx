"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface MemberStat {
  userId: string;
  userName: string;
  userImage?: string;
  isAdmin?: boolean;
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
  [key: string]: any;
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

const LINE_COLORS = [
  "#0284c7", // Sky Blue
  "#10b981", // Emerald Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
];

// Hover Tooltip showing color dots, member name, and task counts
const CustomHoverTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload as DailyTrendItem;
    const dateStr = dataItem.date || "";
    const dayStr = dataItem.day || "";

    const sortedPayload = [...payload].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

    const isMonth = dateStr.length === 7;
    const isWeek = dayStr.startsWith("Week");
    const badgeText = isMonth ? "Monthly Log" : isWeek ? "Weekly Log" : "Daily Log";

    return (
      <div className="bg-white border border-gray-200 text-slate-800 p-3.5 rounded-xl shadow-xl space-y-2 min-w-[280px] max-w-[340px] pointer-events-none">
        <div className="border-b border-gray-100 pb-1.5 flex justify-between items-center">
          <span className="font-semibold text-xs text-sky-700">{dayStr}</span>
          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{badgeText}</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center border-b border-gray-100 pb-1">
            Member Tasks Breakdown ({payload.length})
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5 pt-0.5 custom-thin-scrollbar">
            {sortedPayload.map((entry: any, idx: number) => {
              const memberName = entry.name || "Member";
              const count = entry.value ?? 0;
              const color = entry.color || "#0284c7";
              const uId = entry.dataKey;

              const details = dataItem.userDetails?.[uId];
              const completed = details?.completed ?? 0;
              const activeCount = details?.active ?? 0;
              const pending = details?.pending ?? Math.max(0, count - completed - activeCount);

              return (
                <div key={idx} className="bg-slate-50/90 border border-slate-100 p-2 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-semibold text-slate-800 truncate">{memberName}</span>
                    </div>
                    <span className={`font-bold shrink-0 ml-2 ${count > 0 ? "text-sky-700" : "text-slate-400"}`}>
                      {count} {count === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                  {count > 0 && (
                    <div className="grid grid-cols-3 gap-1 text-[10px] pt-0.5">
                      <div className="bg-emerald-50/90 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-center font-medium">
                        Done: {completed}
                      </div>
                      <div className="bg-indigo-50/90 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded text-center font-medium">
                        In Prog: {activeCount}
                      </div>
                      <div className="bg-amber-50/90 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded text-center font-medium">
                        Pending: {pending}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Side-by-Side Comparison Hover Card
const CustomCompareTooltip = ({ active, payload, nameA, nameB }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload as CompareTrendItem;

    const completedA = dataItem.completedA ?? 0;
    const completedB = dataItem.completedB ?? 0;
    const activeA = dataItem.activeA ?? 0;
    const activeB = dataItem.activeB ?? 0;
    const rawTotalA = dataItem.totalA ?? 0;
    const rawTotalB = dataItem.totalB ?? 0;
    const pendingA = dataItem.pendingA ?? Math.max(0, rawTotalA - completedA - activeA);
    const pendingB = dataItem.pendingB ?? Math.max(0, rawTotalB - completedB - activeB);
    const totalA = completedA + activeA + pendingA;
    const totalB = completedB + activeB + pendingB;

    return (
      <div className="bg-white border border-gray-200 text-slate-800 p-3.5 rounded-xl shadow-xl space-y-2.5 min-w-[280px] pointer-events-none">
        <div className="border-b border-gray-100 pb-1.5 flex justify-between items-center">
          <span className="font-semibold text-xs text-purple-700">{dataItem.day} ({dataItem.date})</span>
          <span className="text-[10px] font-semibold text-slate-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Comparison Log</span>
        </div>

        {/* Side-by-Side Person A vs Person B */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Person A */}
          <div className="bg-sky-50/80 border border-sky-200/70 p-2 rounded-lg space-y-1">
            <div className="font-bold text-sky-900 truncate text-[11px] border-b border-sky-200 pb-0.5">{nameA}</div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>Total Tasks:</span>
              <span className="font-bold text-sky-600">{totalA}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>Completed:</span>
              <span className="font-bold text-emerald-600">{completedA}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>In Progress:</span>
              <span className="font-bold text-indigo-600">{activeA}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>Pending Tasks:</span>
              <span className="font-bold text-amber-600">{pendingA}</span>
            </div>
          </div>

          {/* Person B */}
          <div className="bg-purple-50/80 border border-purple-200/70 p-2 rounded-lg space-y-1">
            <div className="font-bold text-purple-900 truncate text-[11px] border-b border-purple-200 pb-0.5">{nameB}</div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>Total Tasks:</span>
              <span className="font-bold text-purple-600">{totalB}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>Completed:</span>
              <span className="font-bold text-emerald-600">{completedB}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>In Progress:</span>
              <span className="font-bold text-indigo-600">{activeB}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-700">
              <span>Pending Tasks:</span>
              <span className="font-bold text-amber-600">{pendingB}</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-500 font-medium pt-0.5">
          Work Comparison on {dataItem.day}: <span className="font-bold text-sky-700">{nameA} ({totalA})</span> vs <span className="font-bold text-purple-700">{nameB} ({totalB})</span>
        </div>
      </div>
    );
  }
  return null;
};

export const DailyOverviewChart = ({
  dailyTrends,
  allMembers = [],
  selectedTargetUserId = "all",
}: {
  dailyTrends: DailyTrendItem[];
  allMembers?: MemberStat[];
  selectedTargetUserId?: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleMembers = selectedTargetUserId === "all"
    ? allMembers
    : allMembers.filter((m) => m.userId === selectedTargetUserId);

  const membersToRender = visibleMembers.length > 0 ? visibleMembers : allMembers;

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full space-y-3 min-w-0">
      {/* Scrollable Member Legend Bar with < > Navigation Buttons */}
      <div className="flex items-center gap-1.5 bg-slate-50/90 p-1.5 rounded-xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Previous members"
          title="Scroll Left"
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs shrink-0 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 px-1 min-w-0 flex-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {membersToRender.map((member, index) => {
            const cleanName = member.userName.replace(/\s*\(Admin\)/g, "").trim();
            const color = LINE_COLORS[index % LINE_COLORS.length];

            return (
              <div
                key={member.userId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 shadow-2xs hover:border-slate-300 transition"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{cleanName}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Next members"
          title="Scroll Right"
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs shrink-0 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="h-[410px] w-full pt-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={dailyTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              interval={dailyTrends.length > 14 ? Math.ceil(dailyTrends.length / 8) - 1 : 0}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} domain={[0, "auto"]} />
            <Tooltip content={<CustomHoverTooltip />} />

            {membersToRender.map((member, index) => {
              const cleanName = member.userName.replace(/\s*\(Admin\)/g, "").trim();
              const color = LINE_COLORS[index % LINE_COLORS.length];

              return (
                <Line
                  key={member.userId}
                  type="monotone"
                  dataKey={member.userId}
                  name={cleanName}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CompareTrendChart = ({
  compareTrends,
  cleanNameA,
  cleanNameB,
}: {
  compareTrends: CompareTrendItem[];
  cleanNameA: string;
  cleanNameB: string;
}) => {
  return (
    <div className="w-full space-y-3 min-w-0">
      {/* Legend Bar for Person A & Person B Lines */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-50/90 p-2 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shrink-0 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
          <span>{cleanNameA} (Tasks)</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shrink-0 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
          <span>{cleanNameB} (Tasks)</span>
        </div>
      </div>

      <div className="h-[410px] w-full pt-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={compareTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              interval={compareTrends.length > 14 ? Math.ceil(compareTrends.length / 8) - 1 : 0}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} domain={[0, "auto"]} />
            <Tooltip content={<CustomCompareTooltip nameA={cleanNameA} nameB={cleanNameB} />} />
            <Line
              type="monotone"
              dataKey="totalA"
              name={`${cleanNameA} Tasks`}
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ r: 5, fill: "#0284c7", strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="totalB"
              name={`${cleanNameB} Tasks`}
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ r: 5, fill: "#a855f7", strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

