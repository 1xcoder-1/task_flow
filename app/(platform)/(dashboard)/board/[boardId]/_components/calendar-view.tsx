"use client";

import { useState } from "react";
import { useCardModal } from "@/hooks/use-card-modal";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  cards: any[];
}

const DAYS_FULL  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

type ViewMode = "day" | "week" | "month";

// ─── helpers ────────────────────────────────────────────────────────────────
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatHour = (h: number) => {
  if (h === 0) return "12 am";
  if (h < 12) return `${h} am`;
  if (h === 12) return "12 pm";
  return `${h - 12} pm`;
};

const formatTime = (date: Date | string | null | undefined) => {
  if (!date) return null;
  const d = new Date(date);
  return d
    .toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
};

// ─── Task pill (shared) ──────────────────────────────────────────────────────
const TaskPill = ({
  card,
  onClick,
}: {
  card: any;
  onClick: () => void;
}) => {
  const time = formatTime(card.dueDate);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 w-full text-left px-1.5 py-0.5 rounded bg-orange-500/80 hover:bg-orange-500 text-white text-[10px] font-medium leading-snug transition truncate"
    >
      <span className="shrink-0 text-[9px] opacity-80">▶▶</span>
      <span className="truncate">
        {time ? `${time} | ` : ""}
        {card.title}
      </span>
    </button>
  );
};

// ─── Month View ──────────────────────────────────────────────────────────────
const MonthView = ({ currentDate, cardsByDate, openCard }: {
  currentDate: Date;
  cardsByDate: Record<string, any[]>;
  openCard: (id: string) => void;
}) => {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();

  const cells: any[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ type: "empty", key: `e-${i}` });
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      type: "day", day, key,
      dayCards: cardsByDate[key] || [],
      isToday: now.getFullYear() === year && now.getMonth() === month && now.getDate() === day,
    });
  }

  return (
    <>
      {/* Weekday header row */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-white/50 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 gap-px bg-white/[0.08] rounded-xl overflow-auto border border-white/10 cal-scrollbar">
        {cells.map((cell) => {
          if (cell.type === "empty") return <div key={cell.key} className="bg-white/[0.03] min-h-[90px]" />;
          return (
            <div
              key={cell.key}
              className={`relative flex flex-col p-2 min-h-[90px] transition-colors ${
                cell.isToday ? "bg-white/[0.18] ring-inset ring-1 ring-orange-400/60" : "bg-white/[0.07] hover:bg-white/[0.12]"
              }`}
            >
              <span className={`self-end text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                cell.isToday ? "bg-orange-500 text-white" : "text-white/50"
              }`}>
                {cell.day}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {cell.dayCards.slice(0, 3).map((card: any) => (
                  <TaskPill key={card.id} card={card} onClick={() => openCard(card.id)} />
                ))}
                {cell.dayCards.length > 3 && (
                  <span className="text-[9px] text-white/40 pl-1 font-medium">+{cell.dayCards.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─── Week View ───────────────────────────────────────────────────────────────
const WeekView = ({ currentDate, cardsByDate, openCard }: {
  currentDate: Date;
  cardsByDate: Record<string, any[]>;
  openCard: (id: string) => void;
}) => {
  // Build 7 days starting from Sunday of the current week
  const dow = currentDate.getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - dow);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const now = new Date();
  const todayKey = toDateKey(now);

  return (
    <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          return (
            <div key={key} className={`py-3 px-2 text-center border-r border-white/10 last:border-0 ${isToday ? "bg-white/[0.08]" : ""}`}>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{DAYS_SHORT[d.getDay()]}</p>
              <span className={`mt-1 mx-auto flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                isToday ? "bg-orange-500 text-white" : "text-white/70"
              }`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cards per day */}
      <div className="grid grid-cols-7 flex-1 overflow-auto cal-scrollbar">
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          const dayCards = cardsByDate[key] || [];
          return (
            <div key={key} className={`flex flex-col gap-1 p-2 border-r border-white/10 last:border-0 min-h-[200px] ${isToday ? "bg-white/[0.10]" : "bg-white/[0.04]"}`}>
              {dayCards.length === 0 ? (
                <p className="text-[10px] text-white/20 text-center pt-4">—</p>
              ) : (
                dayCards.map((card: any) => (
                  <TaskPill key={card.id} card={card} onClick={() => openCard(card.id)} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Day View ────────────────────────────────────────────────────────────────
const DayView = ({ currentDate, cards, openCard }: {
  currentDate: Date;
  cards: any[];
  openCard: (id: string) => void;
}) => {
  const dayKey = toDateKey(currentDate);
  const dayCards = cards.filter((c) => {
    if (!c.dueDate) return false;
    return toDateKey(new Date(c.dueDate)) === dayKey;
  });

  // Build a map: hour → cards
  const byHour: Record<number, any[]> = {};
  dayCards.forEach((c) => {
    const h = new Date(c.dueDate).getHours();
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(c);
  });

  const now = new Date();
  const isToday = toDateKey(now) === dayKey;
  const currentHour = now.getHours();

  const dayLabel = currentDate.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-white/10">
      {/* Day title */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.04]">
        <p className="text-sm font-semibold text-white/80">{dayLabel}</p>
        {dayCards.length === 0 && (
          <p className="text-xs text-white/30 mt-0.5">No tasks due today</p>
        )}
      </div>

      {/* Hour rows */}
      <div className="flex-1 overflow-auto cal-scrollbar">
        {HOURS.map((h) => {
          const isCurrent = isToday && h === currentHour;
          const hourCards = byHour[h] || [];
          return (
            <div key={h} className={`flex border-b border-white/[0.08] min-h-[52px] ${isCurrent ? "bg-orange-500/15" : "hover:bg-white/[0.04]"}`}>
              {/* Hour label */}
              <div className="w-20 shrink-0 px-3 pt-2 text-[11px] font-semibold text-right select-none">
                {isCurrent ? (
                  <span className="text-orange-400 font-bold">{formatHour(h)}</span>
                ) : (
                  <span className="text-white/70">{formatHour(h)}</span>
                )}
              </div>
              {/* Divider line */}
              <div className={`w-px shrink-0 ${isCurrent ? "bg-orange-400/60" : "bg-white/20"}`} />
              {/* Cards */}
              <div className="flex-1 flex flex-col gap-1 px-3 py-1.5">
                {hourCards.map((card: any) => (
                  <TaskPill key={card.id} card={card} onClick={() => openCard(card.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const CalendarView = ({ cards }: CalendarViewProps) => {
  const cardModal = useCardModal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Navigation — adapts per view ──
  const goBack = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const goForward = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // ── Title label per view ──
  const headerLabel = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const dow = currentDate.getDay();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - dow);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const s = weekStart.toLocaleString("en-US", { month: "short", day: "numeric" });
      const e = weekEnd.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${s} – ${e}`;
    }
    return currentDate.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  // ── Group cards by date key ──
  const cardsByDate: Record<string, any[]> = {};
  cards.forEach((card) => {
    if (card.dueDate) {
      const key = toDateKey(new Date(card.dueDate));
      if (!cardsByDate[key]) cardsByDate[key] = [];
      cardsByDate[key].push(card);
    }
  });

  const openCard = (id: string) => cardModal.onOpen(id);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-x-2">
          <button type="button" onClick={goBack}
            className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={goForward}
            className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={goToday}
            className="px-3 py-1 text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition border border-white/20">
            Today
          </button>
          <h2 className="text-sm font-semibold text-white/90 ml-2 whitespace-nowrap">
            {headerLabel()}
          </h2>
        </div>

        {/* Day / Week / Month toggle */}
        <div className="flex items-center bg-black/30 border border-white/15 rounded-lg p-0.5 gap-0.5">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                viewMode === mode
                  ? "bg-orange-500 text-white shadow"
                  : "text-white/60 hover:text-white/90 hover:bg-white/10"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Views ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {viewMode === "month" && (
          <MonthView currentDate={currentDate} cardsByDate={cardsByDate} openCard={openCard} />
        )}
        {viewMode === "week" && (
          <WeekView currentDate={currentDate} cardsByDate={cardsByDate} openCard={openCard} />
        )}
        {viewMode === "day" && (
          <DayView currentDate={currentDate} cards={cards} openCard={openCard} />
        )}
      </div>
    </div>
  );
};
