import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { TimeTrackerClient } from "./_components/time-tracker-client";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

const TimeTrackerPage = async ({ params }: Props) => {
  const [{ organizationId }, { userId }] = await Promise.all([params, auth()]);

  let initialPendingCards: any[] = [];
  let initialActiveCard: any = null;
  let completedTodayCount = 0;

  if (userId) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const userCards = await db.card.findMany({
      where: {
        isArchived: false,
        assignments: {
          some: {
            userId,
          },
        },
        ...(organizationId ? { list: { board: { orgId: organizationId } } } : {}),
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        isActive: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        list: {
          select: {
            id: true,
            title: true,
            board: {
              select: {
                id: true,
                title: true,
                orgId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { updatedAt: "desc" },
      ],
    });

    initialPendingCards = userCards.filter((card) => card.status !== "DONE");
    initialActiveCard = initialPendingCards.find((card) => card.isActive || card.status === "IN_PROGRESS") || null;
    completedTodayCount = userCards.filter((card) => card.status === "DONE" && new Date(card.updatedAt) >= startOfToday).length;
  }

  return (
    <div className="w-full">
      <TimeTrackerClient
        organizationId={organizationId}
        initialPendingCards={initialPendingCards}
        initialActiveCard={initialActiveCard}
        initialCompletedTodayCount={completedTodayCount}
      />
    </div>
  );
};

export default TimeTrackerPage;
