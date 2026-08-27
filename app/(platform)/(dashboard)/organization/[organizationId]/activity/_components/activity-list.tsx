import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ActivityItem } from "@/components/activity-item";
import { db } from "@/lib/db";

interface ActivityListProps {
  page?: number;
}

export const ActivityList = async ({ page = 1 }: ActivityListProps) => {
  const { orgId } = await auth();

  if (!orgId) return redirect("/select-org");

  const ITEMS_PER_PAGE = 10;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [auditLogs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    db.auditLog.count({
      where: {
        orgId,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <ol className="space-y-4 mt-4">
        <p className="hidden last:block text-xs text-center text-muted-foreground">
          No activity found inside this organization.
        </p>

        {auditLogs.map((log) => (
          <ActivityItem key={log.id} data={log} />
        ))}
      </ol>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-x-2 mt-8 pb-8">
          <Link
            href={`/organization/${orgId}/activity?page=${page - 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page <= 1 && "pointer-events-none opacity-50"
            )}
          >
            Previous
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/organization/${orgId}/activity?page=${page + 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page >= totalPages && "pointer-events-none opacity-50"
            )}
          >
            Next
          </Link>
        </div>
      )}
    </>
  );
};

ActivityList.Skeleton = function ActivityListSkeleton() {
  return (
    <ol className="space-y-4 mt-4">
      <Skeleton className="w-[80%] h-14" />
      <Skeleton className="w-[50%] h-14" />
      <Skeleton className="w-[70%] h-14" />
      <Skeleton className="w-[80%] h-14" />
      <Skeleton className="w-[75%] h-14" />
    </ol>
  );
};
