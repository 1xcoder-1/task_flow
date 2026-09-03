import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import { ActivityItem } from "@/components/activity-item";
import { db } from "@/lib/db";

interface ActivityListProps {
  page?: number;
}

export const LogsCardsSkeleton = () => {
  return (
    <div className="space-y-2.5 my-2">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200/90 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/3 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
};

const ActivityLogsCards = async ({ orgId, page }: { orgId: string; page: number }) => {
  const ITEMS_PER_PAGE = 10;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const auditLogs = await db.auditLog.findMany({
    where: {
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      action: true,
      entityId: true,
      entityType: true,
      entityTitle: true,
      userId: true,
      userImage: true,
      userName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: ITEMS_PER_PAGE,
    skip,
  });

  if (auditLogs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-2 my-2">
        <Activity className="h-8 w-8 text-slate-300 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">No activity logged yet</p>
        <p className="text-xs text-slate-400">Actions taken by team members will automatically appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative my-2">
      <ol
        className="space-y-2.5 overflow-y-auto max-h-[60vh] md:max-h-[580px] pr-1 py-0.5"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {auditLogs.map((log) => (
          <ActivityItem key={log.id} data={log} />
        ))}
      </ol>
    </div>
  );
};

export const ActivityList = async ({ page = 1 }: ActivityListProps) => {
  const { orgId } = await auth();

  if (!orgId) return redirect("/select-org");

  const ITEMS_PER_PAGE = 10;
  const totalCount = await db.auditLog.count({
    where: {
      orgId,
    },
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* STATIC HEADING - ALWAYS VISIBLE */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg border border-sky-100 shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Team Activity Log
            </h2>
            <p className="text-xs text-slate-500">
              Live audit trail of all workspace actions performed by members and admins
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shrink-0">
          {totalCount} Total Logs
        </span>
      </div>

      {/* ONLY LOG CARDS ARE WRAPPED IN SUSPENSE FOR SKELETON LAZY LOADING */}
      <Suspense key={page} fallback={<LogsCardsSkeleton />}>
        <ActivityLogsCards orgId={orgId} page={page} />
      </Suspense>

      {/* STATIC PAGINATION BUTTONS - ALWAYS VISIBLE */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200/80 pt-2.5 mt-3 pb-1">
          <Link
            href={`/organization/${orgId}/activity?page=${page - 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-semibold rounded-lg shadow-2xs bg-white text-slate-700 hover:bg-slate-50 border-gray-300",
              page <= 1 && "pointer-events-none opacity-40"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Link>

          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Page {page} of {totalPages}
          </span>

          <Link
            href={`/organization/${orgId}/activity?page=${page + 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-semibold rounded-lg shadow-2xs bg-white text-slate-700 hover:bg-slate-50 border-gray-300",
              page >= totalPages && "pointer-events-none opacity-40"
            )}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

ActivityList.Skeleton = function ActivityListSkeleton() {
  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-60 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <LogsCardsSkeleton />
    </div>
  );
};
