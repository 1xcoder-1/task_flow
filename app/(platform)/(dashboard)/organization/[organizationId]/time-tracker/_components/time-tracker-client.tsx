"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { useEventListener, useBroadcastEvent } from "@liveblocks/react";

interface PendingTaskItem {
  id: string;
  title: string;
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
}

interface TimeTrackerClientProps {
  organizationId: string;
}

export const TimeTrackerClient = ({ organizationId }: TimeTrackerClientProps) => {
  const cardModal = useCardModal();
  const broadcast = useBroadcastEvent();

  const [pendingCards, setPendingCards] = useState<PendingTaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Pending Tasks Data
  const fetchPendingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/me/pending?orgId=${organizationId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load pending tasks");
      const data = await res.json();
      if (data.success) {
        setPendingCards(data.pendingCards || []);

        if (data.activeCard && (data.activeCard.isActive || data.activeCard.status === "IN_PROGRESS")) {
          setActiveTaskId(data.activeCard.id);
          setSelectedTaskId(data.activeCard.id);
          setIsTimerRunning(true);
        } else {
          setActiveTaskId(null);
          setIsTimerRunning(false);
          if (data.pendingCards && data.pendingCards.length > 0 && !selectedTaskId) {
            setSelectedTaskId(data.pendingCards[0].id);
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load time tracker data.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedTaskId]);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  // Real-time event listener via Liveblocks
  useEventListener(({ event }) => {
    if (!event || typeof event !== "object") return;
    const e = event as any;

    if (e.type === "TIMER_STARTED" || e.type === "TIMER_PAUSED" || e.type === "TASK_COMPLETED") {
      fetchPendingData();
    }
  });

  // Stopwatch interval ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && activeTaskId) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
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

    try {
      broadcast({
        type: "TIMER_STARTED",
        data: { taskId: task.id, title: task.title },
      });
    } catch (e) {
      // Ignore liveblocks fallback
    }

    toast.info(`Started timer for "${task.title}"`);
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

    try {
      broadcast({
        type: "TIMER_PAUSED",
        data: { taskId: task.id, title: task.title },
      });
    } catch (e) {
      // Ignore liveblocks fallback
    }

    toast.info(`Paused timer for "${task.title}"`);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    toast.info("Timer reset");
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

    try {
      broadcast({
        type: "TASK_COMPLETED",
        data: { taskId: task.id, title: task.title },
      });
    } catch (e) {
      // Ignore liveblocks fallback
    }

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
      <div className="w-full space-y-4 p-4 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 p-3 sm:p-5 max-w-4xl mx-auto text-slate-800 transition-all overflow-y-auto max-h-[calc(100vh-3rem)] scrollbar-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Time Tracker</h1>
          <p className="text-xs text-slate-500 font-medium">Stopwatch & pending tasks</p>
        </div>
      </div>

      {/* Simple Timer Focus Engine */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="space-y-1">
          <label htmlFor="select-assigned-task" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Select Task
          </label>
          <select
            id="select-assigned-task"
            aria-label="Select Task"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer truncate"
          >
            {pendingCards.length === 0 ? (
              <option value="">No pending tasks</option>
            ) : (
              pendingCards.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.list.board.title}] {t.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Stopwatch Display & Main Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-slate-900 bg-amber-50/80 px-5 py-2.5 rounded-xl border border-amber-200 shadow-2xs font-numeric">
            {formatTimer(timerSeconds)}
          </div>

          <div className="flex items-center gap-2">
            {isTimerRunning ? (
              <Button
                size="default"
                onClick={() => activeTask && handlePauseTimer(activeTask)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-5 rounded-xl"
              >
                <Pause className="h-4 w-4 mr-1.5" /> Pause
              </Button>
            ) : (
              <Button
                size="default"
                onClick={handleStartTimerForSelected}
                disabled={!selectedTaskId}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-10 px-5 rounded-xl"
              >
                <Play className="h-4 w-4 mr-1.5 fill-slate-950" /> Start
              </Button>
            )}

            <Button
              size="default"
              variant="outline"
              onClick={handleResetTimer}
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-10 px-3 rounded-xl"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {activeTask && (
              <Button
                size="default"
                onClick={() => handleToggleComplete(activeTask)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl"
              >
                <Check className="h-4 w-4 mr-1" /> Done
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pending Tasks Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="font-bold text-slate-900 text-sm">Assigned Tasks ({pendingCards.length})</h3>
          <span className="text-xs text-slate-400 font-medium">Click task to view or start</span>
        </div>

        <div className="space-y-2">
          {pendingCards.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No pending tasks assigned to you.
            </div>
          ) : (
            pendingCards.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const isInProgress = task.status === "IN_PROGRESS" || task.isActive;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition bg-white gap-3",
                    isInProgress && "border-amber-300 bg-amber-50/20",
                    isSelected && !isInProgress && "border-slate-300 bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="text-slate-400 hover:text-emerald-600 transition shrink-0 cursor-pointer"
                      title="Mark done"
                    >
                      <Check className="h-4 w-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <span
                        onClick={() => cardModal.onOpen(task.id)}
                        className="font-semibold text-sm text-slate-900 hover:text-amber-600 cursor-pointer transition truncate block"
                      >
                        {task.title}
                      </span>
                      <p className="text-xs text-slate-400 truncate">
                        {task.list.board.title} &bull; {task.list.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isInProgress ? (
                      <Button
                        size="sm"
                        onClick={() => handlePauseTimer(task)}
                        className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3"
                      >
                        <Pause className="h-3 w-3 mr-1" /> Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleStartTimerForTask(task)}
                        className="h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg px-3"
                      >
                        <Play className="h-3 w-3 mr-1 fill-slate-950" /> Start
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cardModal.onOpen(task.id)}
                      className="h-8 text-xs text-slate-500 hover:bg-slate-100 rounded-lg px-2"
                      title="View card"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
