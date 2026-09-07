import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

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
        ...(orgId ? { list: { board: { orgId } } } : {}),
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

    const pendingCards = userCards.filter((card) => card.status !== "DONE");
    const activeCard = pendingCards.find((card) => card.isActive || card.status === "IN_PROGRESS") || null;
    const completedTodayCount = userCards.filter((card) => card.status === "DONE" && new Date(card.updatedAt) >= startOfToday).length;

    return NextResponse.json({
      success: true,
      pendingCards,
      activeCard,
      completedTodayCount,
    });
  } catch (error) {
    console.error("[TASKS_ME_PENDING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
