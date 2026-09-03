"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Circle, 
  Check, 
  ExternalLink, 
  Flame, 
  ListFilter, 
  Sparkles,
  Timer,
  Tag,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";

interface PendingTaskItem {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  dueDate?: string | Date | null;
  isActive: boolean;
  status: string;
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
      orgId: string;
    };
  };
  subtasks?: Array<{ id: string; isCompleted: boolean }>;
}

interface TimeTrackerClientProps {
  organizationId: string;
}

export const TimeTrackerClient = ({ organizationId }: TimeTrackerClientProps) => {
  const cardModal = useCardModal();

  const [pendingCards, setPendingCards] = useState<PendingTaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalLoggedTodaySec, setTotalLoggedTodaySec] = useState(0);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/me/pending?orgId=${organizationId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load pending tasks");
      const data = await res.json();
      if (data.success) {
        setPendingCards(data.pendingCards || []);
        setCompletedTodayCount(data.completedTodayCount || 0);

        if (data.activeCard && !activeTaskId) {
          setActiveTaskId(data.activeCard.id);
          setSelectedTaskId(data.activeCard.id);
          setIsTimerRunning(true);
        } else if (data.pendingCards.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data.pendingCards[0].id);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load time tracker data.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, activeTaskId, selectedTaskId]);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  // Stopwatch interval ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && activeTaskId) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
        setTotalLoggedTodaySec((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeTaskId]);

  const { execute: executeUpdateCard } = useAction(updateCard, {
    onSuccess: () => {
      fetchPendingData();
    },
    onError: (error) => {
      toast.error(error || "Failed to update task.");
    },
  });

  const handleStartTimerForTask = (task: PendingTaskItem) => {
    setSelectedTaskId(task.id);
    setActiveTaskId(task.id);
    setIsTimerRunning(true);
    executeUpdateCard({
      id: task.id,
      boardId: task.list.board.id,
      status: "IN_PROGRESS",
      isActive: true,
    });
    toast.info(`Started stopwatch for "${task.title}"`);
  };

  const handleStartTimerForSelected = () => {
    const taskToStart = pendingCards.find((t) => t.id === selectedTaskId);
    if (!taskToStart) {
      toast.error("Please select a task first.");
      return;
    }
    handleStartTimerForTask(taskToStart);
  };

  const handlePauseTimer = (task: PendingTaskItem) => {
    if (activeTaskId === task.id) {
      setIsTimerRunning(false);
    }
    executeUpdateCard({
      id: task.id,
      boardId: task.list.board.id,
      status: "PENDING",
      isActive: false,
    });
    toast.info(`Paused stopwatch for "${task.title}"`);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    toast.info("Stopwatch reset");
  };

  const handleToggleComplete = (task: PendingTaskItem) => {
    if (activeTaskId === task.id) {
      setIsTimerRunning(false);
    }

    executeUpdateCard({
      id: task.id,
      boardId: task.list.board.id,
      status: "DONE",
      isActive: false,
    });

    toast.success(`Completed "${task.title}"! 🎉`);
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const activeTask = pendingCards.find((t) => t.id === activeTaskId) || pendingCards.find((t) => t.id === selectedTaskId);

  if (isLoading) {
    return (
      <div className="w-full space-y-6 p-2 md:p-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-2 md:p-4 max-w-6xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-2xs">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Tracking & Active Tasks</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Focus stopwatch and assigned pending tasks</p>
          </div>
        </div>
      </div>

      {/* Main Stopwatch Unit */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Timer className="h-4 w-4 mr-1.5 text-amber-400" />
              Focus Stopwatch Engine
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span>Session Focus: <strong className="font-mono text-amber-400">{formatTimer(totalLoggedTodaySec)}</strong></span>
            <span>Completed Today: <strong className="text-emerald-400">{completedTodayCount}</strong></span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Dropdown Task Picker */}
          <div className="flex-1 space-y-2 min-w-0">
            <label htmlFor="select-assigned-task" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Select Pending Task to Start Timer</label>
            <select
              id="select-assigned-task"
              aria-label="Select Pending Task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer truncate"
            >
              {pendingCards.length === 0 ? (
                <option value="">No pending tasks assigned to you</option>
              ) : (
                pendingCards.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.list.board.title}] {t.title} ({t.priority || "Normal"})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Stopwatch Digital Display & Buttons */}
          <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap sm:flex-nowrap">
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wider text-amber-400 bg-slate-800 px-5 py-2.5 rounded-xl border border-slate-700 shadow-inner">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex items-center gap-2">
              {isTimerRunning ? (
                <Button
                  size="sm"
                  onClick={() => activeTask && handlePauseTimer(activeTask)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold h-11 px-5 rounded-xl shadow-xs"
                >
                  <Pause className="h-4 w-4 mr-1.5" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStartTimerForSelected}
                  disabled={!selectedTaskId}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-11 px-5 rounded-xl shadow-xs"
                >
                  <Play className="h-4 w-4 mr-1.5 fill-slate-950" />
                  Start Timer
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleResetTimer}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 h-11 px-3 rounded-xl"
                title="Reset Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {activeTask && (
                <Button
                  size="sm"
                  onClick={() => handleToggleComplete(activeTask)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 px-4 rounded-xl shadow-xs"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Assigned Tasks List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <ListFilter className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Your Pending Tasks ({pendingCards.length})</h3>
          </div>
          <span className="text-xs text-slate-500">Only assigned incomplete tasks</span>
        </div>

        {pendingCards.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">All caught up! No pending tasks.</h4>
            <p className="text-xs text-slate-500">Great work! Any new assigned tasks will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCards.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const isInProgress = task.status === "IN_PROGRESS" || task.isActive;
              const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
              const totalSubtasks = task.subtasks?.length || 0;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition bg-white gap-4",
                    isInProgress && "border-amber-300 ring-1 ring-amber-200 bg-amber-50/20",
                    isSelected && !isInProgress && "border-slate-300 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition shrink-0 cursor-pointer"
                    >
                      <Circle className="h-5 w-5" />
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => cardModal.onOpen(task.id)}
                          className="font-semibold text-sm text-slate-900 hover:text-amber-600 cursor-pointer transition truncate"
                        >
                          {task.title}
                        </span>

                        {task.priority && (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 font-bold rounded-md uppercase border",
                            task.priority === "High" && "bg-rose-50 text-rose-700 border-rose-200",
                            task.priority === "Medium" && "bg-amber-50 text-amber-700 border-amber-200",
                            task.priority === "Low" && "bg-slate-100 text-slate-700 border-slate-200"
                          )}>
                            {task.priority}
                          </span>
                        )}

                        {isInProgress && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md border border-amber-200">
                            Active Stopwatch
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="font-medium text-slate-600">
                          {task.list.board.title} &bull; {task.list.title}
                        </span>

                        {totalSubtasks > 0 && (
                          <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                        )}

                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isInProgress ? (
                      <Button
                        size="sm"
                        onClick={() => handlePauseTimer(task)}
                        className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                      >
                        <Pause className="h-3.5 w-3.5 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleStartTimerForTask(task)}
                        className="h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg"
                      >
                        <Play className="h-3.5 w-3.5 mr-1 fill-slate-950" />
                        Start Timer
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cardModal.onOpen(task.id)}
                      className="h-8 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="View card details"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
