"use client";

import { useEffect, useState, useTransition, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { Bell, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getNotifications } from "@/actions/get-notifications";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/mark-notification-read";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  isRead: boolean;
  actorImage: string | null;
  actorName: string | null;
  message: string | null;
  createdAt: Date;
  linkUrl: string | null;
}

interface NotifState {
  notifications: Notification[];
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}

const EMPTY_STATE: NotifState = {
  notifications: [],
  totalCount: 0,
  totalPages: 0,
  unreadCount: 0,
};

const subscribeNoop = () => () => {};
const getSnapshotClient = () => true;
const getSnapshotServer = () => false;

export const NotificationPopover = () => {
  const [state, setState] = useState<NotifState>(EMPTY_STATE);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  const isMounted = useSyncExternalStore(
    subscribeNoop,
    getSnapshotClient,
    getSnapshotServer
  );

  const { notifications, totalPages, unreadCount } = state;

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (p: number) => {
    const data = await getNotifications(p);
    setState(data as NotifState);
  }, []);

  // Background poll every 5s for unread count (only fetches page 1 to get unreadCount)
  useEffect(() => {
    fetchPage(page);

    const interval = setInterval(() => fetchPage(page), 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchPage(page);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchPage, page]);

  // Refresh immediately when popover opens; reset to page 1
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchPage(1);
    }
  }, [isOpen, fetchPage]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const onMarkRead = (id: string, url: string | null) => {
    startTransition(async () => {
      await markNotificationRead(id, pathname);
      await fetchPage(page);
      if (url) {
        setIsOpen(false);
        router.push(url);
      }
    });
  };

  const onMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead(pathname);
      setPage(1);
      await fetchPage(1);
    });
  };

  const onPrevPage = () => {
    const prev = Math.max(1, page - 1);
    setPage(prev);
    fetchPage(prev);
  };

  const onNextPage = () => {
    const next = Math.min(totalPages, page + 1);
    setPage(next);
    fetchPage(next);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative text-neutral-600 hover:bg-neutral-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-neutral-600" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-neutral-600 hover:bg-neutral-200"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <Bell className={`h-5 w-5 transition-all ${unreadCount > 0 ? "text-rose-500" : ""}`} />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none z-10">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-400 animate-ping opacity-75" />
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-xl border border-neutral-200 rounded-xl overflow-hidden" sideOffset={10}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-neutral-50">
          <div className="flex items-center gap-x-2">
            <Bell className="h-4 w-4 text-neutral-500" />
            <h4 className="text-sm font-semibold text-neutral-800">Notifications</h4>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={onMarkAllRead}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-primary rounded-md"
              disabled={isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* ── Notification List ── */}
        <div className="flex flex-col divide-y divide-neutral-100 max-h-[480px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-y-2 text-center">
              <Bell className="h-8 w-8 text-neutral-200" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onMarkRead(notification.id, notification.linkUrl)}
                className={`flex items-start gap-x-3 px-4 py-3 cursor-pointer hover:bg-neutral-100 transition-colors ${
                  notification.isRead ? "opacity-60" : "bg-rose-50/40"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  {notification.actorImage ? (
                    <Image
                      src={notification.actorImage}
                      alt={notification.actorName || "User"}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-neutral-200"
                      width={32}
                      height={32}
                      unoptimized
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold">
                      {(notification.actorName || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!notification.isRead && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-y-0.5 flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold text-neutral-800 mr-1">
                      {notification.actorName}
                    </span>
                    <span className="text-neutral-600">{notification.message}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Pagination Footer ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-neutral-50">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={onPrevPage}
              disabled={page <= 1 || isPending}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs text-muted-foreground font-medium">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={onNextPage}
              disabled={page >= totalPages || isPending}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
