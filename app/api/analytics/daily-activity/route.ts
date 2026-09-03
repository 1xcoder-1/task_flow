import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function dayKey(date: Date, tzOffsetMin: number) {
  return new Date(date.getTime() - tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

function addDay(dateStr: string, n: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function labelForDay(dateStr: string, overall: boolean) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    timeZone: "UTC",
    ...(overall ? { month: "short", day: "numeric" } : { weekday: "short" }),
  });
}

function isActiveCard(card: { status: string; isActive: boolean }) {
  return card.status === "IN_PROGRESS" || card.isActive;
}

type MemberStat = {
  userId: string;
  userName: string;
  userImage?: string;
  isAdmin?: boolean;
  joinedAt?: string;
  assignedCount: number;
  activeCount: number;
  completedCount: number;
  pendingCount: number;
};

type MemberDayBreakdown = {
  userName: string;
  assigned: number;
  active: number;
  completed: number;
};

export async function GET(req: Request) {
  try {
    const { userId, orgRole } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    let targetUserId = searchParams.get("targetUserId");
    let compareUserId = searchParams.get("compareUserId");
    const range = searchParams.get("range") === "overall" ? "overall" : "daily";
    const tzOffsetMin = Number(searchParams.get("tzOffset") ?? 0) || 0;
    const todayStr =
      searchParams.get("localDate") || dayKey(new Date(), tzOffsetMin);

    const isAdmin = orgRole === "org:admin";

    if (!isAdmin) {
      targetUserId = userId;
    }

    const rawCards = await db.card.findMany({
      where: {
        isArchived: false,
        ...(orgId ? { list: { board: { orgId } } } : {}),
      },
      include: {
        assignments: true,
        list: {
          select: {
            title: true,
            board: {
              select: {
                title: true,
                isImpBoard: true,
                dayFolder: {
                  select: {
                    monthFolder: {
                      select: {
                        yearFolder: {
                          select: {
                            folder: {
                              select: {
                                title: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const allCards = rawCards.filter((card) => {
      // Must be assigned to at least 1 person to be counted in analytics
      return Boolean(card.assignments && card.assignments.length > 0);
    });

    const memberMap: Record<string, MemberStat> = {};
    const client = await clerkClient();

    let currentAdminName = "Admin";
    try {
      const currentUser = await client.users.getUser(userId);
      currentAdminName =
        [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ||
        currentUser.username ||
        currentUser.emailAddresses[0]?.emailAddress ||
        "Admin";

      memberMap[userId] = {
        userId,
        userName: currentAdminName,
        userImage: currentUser.imageUrl,
        isAdmin: isAdmin,
        assignedCount: 0,
        activeCount: 0,
        completedCount: 0,
        pendingCount: 0,
      };
    } catch (e) {
      console.error("Error fetching current user details:", e);
    }

    if (orgId) {
      try {
        const membershipsResponse = await client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
          limit: 100,
        });

        const memberships = Array.isArray(membershipsResponse)
          ? membershipsResponse
          : (membershipsResponse as any)?.data || [];

        for (const mem of memberships) {
          const uId = mem.publicUserData?.userId || mem.userId;
          if (!uId) continue;

          let fullName = [mem.publicUserData?.firstName, mem.publicUserData?.lastName]
            .filter(Boolean)
            .join(" ");
          let identifier = mem.publicUserData?.identifier || mem.publicUserData?.emailAddress || "";
          let name = fullName.trim() ? fullName : identifier;

          if (!name || name === "Member") {
            try {
              const u = await client.users.getUser(uId);
              name =
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.username ||
                u.emailAddresses[0]?.emailAddress ||
                "Member";
            } catch {
              name = "Member";
            }
          }

          const isMemAdmin = mem.role === "org:admin" || uId === userId;
          const joinedAt = mem.createdAt
            ? dayKey(new Date(mem.createdAt), tzOffsetMin)
            : undefined;

          if (!memberMap[uId]) {
            memberMap[uId] = {
              userId: uId,
              userName: name,
              userImage: mem.publicUserData?.imageUrl,
              isAdmin: isMemAdmin,
              joinedAt,
              assignedCount: 0,
              activeCount: 0,
              completedCount: 0,
              pendingCount: 0,
            };
          } else {
            memberMap[uId].userName = name;
            memberMap[uId].isAdmin = isMemAdmin;
            memberMap[uId].joinedAt = joinedAt;
            if (mem.publicUserData?.imageUrl) memberMap[uId].userImage = mem.publicUserData?.imageUrl;
          }
        }
      } catch (clerkErr) {
        console.error("Error fetching Clerk org members:", clerkErr);
      }

      try {
        const orgAuditLogs = await db.auditLog.findMany({
          where: { orgId },
          select: { userId: true, userName: true, userImage: true },
          distinct: ["userId"],
        });

        orgAuditLogs.forEach((log) => {
          if (log.userId && !memberMap[log.userId]) {
            memberMap[log.userId] = {
              userId: log.userId,
              userName: log.userName || "Member",
              userImage: log.userImage,
              isAdmin: false,
              assignedCount: 0,
              activeCount: 0,
              completedCount: 0,
              pendingCount: 0,
            };
          }
        });
      } catch (dbErr) {
        console.error("Audit log member query error:", dbErr);
      }
    }

    const bumpMember = (uId: string, name: string, image?: string | null) => {
      if (!memberMap[uId]) {
        memberMap[uId] = {
          userId: uId,
          userName: name,
          userImage: image || undefined,
          isAdmin: false,
          assignedCount: 0,
          activeCount: 0,
          completedCount: 0,
          pendingCount: 0,
        };
      }
      return memberMap[uId];
    };

    allCards.forEach((card) => {
      card.assignments.forEach((assignee) => {
        const mem = bumpMember(assignee.userId, assignee.userName || "Member", assignee.userImage);
        const assignedDay = dayKey(assignee.createdAt, tzOffsetMin);
        const updatedDay = dayKey(card.updatedAt, tzOffsetMin);
        const inDailyWindow = assignedDay === todayStr || updatedDay === todayStr;

        if (range === "overall" || inDailyWindow) {
          if (range === "overall" || assignedDay === todayStr) mem.assignedCount += 1;
          if (range === "overall") {
            if (card.status === "DONE") mem.completedCount += 1;
            else if (isActiveCard(card)) mem.activeCount += 1;
            else mem.pendingCount += 1;
          } else {
            if (card.status === "DONE" && updatedDay === todayStr) mem.completedCount += 1;
            else if (isActiveCard(card) && updatedDay === todayStr) mem.activeCount += 1;
            else if (assignedDay === todayStr && card.status !== "DONE" && !isActiveCard(card)) {
              mem.pendingCount += 1;
            }
          }
        }
      });
    });

    // Overall mode: assignedCount above counted only assignments (one per assign).
    // Recompute overall as current snapshot so KPIs match live org stats.
    if (range === "overall") {
      Object.values(memberMap).forEach((m) => {
        m.assignedCount = 0;
        m.activeCount = 0;
        m.completedCount = 0;
        m.pendingCount = 0;
      });
      allCards.forEach((card) => {
        card.assignments.forEach((assignee) => {
          const mem = bumpMember(assignee.userId, assignee.userName || "Member", assignee.userImage);
          mem.assignedCount += 1;
          if (card.status === "DONE") mem.completedCount += 1;
          else if (isActiveCard(card)) mem.activeCount += 1;
          else mem.pendingCount += 1;
        });
      });
    }

    const allMembersList = Object.values(memberMap);
    const visibleMembers = isAdmin
      ? allMembersList
      : allMembersList.filter((m) => m.userId === userId);

    const effectiveTargetUserId =
      targetUserId && targetUserId !== "all" ? targetUserId : visibleMembers[0]?.userId;

    if (!compareUserId && visibleMembers.length > 1) {
      const secondMem = visibleMembers.find((m) => m.userId !== effectiveTargetUserId);
      if (secondMem) compareUserId = secondMem.userId;
    }

    const scopedUserId = !isAdmin || (targetUserId && targetUserId !== "all")
      ? (isAdmin ? targetUserId : userId)
      : null;

    const targetCards = scopedUserId
      ? allCards.filter((c) => c.assignments.some((a) => a.userId === scopedUserId))
      : allCards;

    const scopedMembers = scopedUserId
      ? visibleMembers.filter((m) => m.userId === scopedUserId)
      : visibleMembers;

    const joinDates = scopedMembers
      .map((m) => m.joinedAt)
      .filter((d): d is string => Boolean(d));

    let earliestJoin = joinDates.length ? joinDates.reduce((a, b) => (a < b ? a : b)) : todayStr;

    // Check card dates for targetCards as well to ensure full 2-3 year history is captured
    targetCards.forEach((c) => {
      const updatedDay = dayKey(c.updatedAt, tzOffsetMin);
      if (updatedDay < earliestJoin) earliestJoin = updatedDay;
      c.assignments.forEach((a) => {
        const createdDay = dayKey(a.createdAt, tzOffsetMin);
        if (createdDay < earliestJoin) earliestJoin = createdDay;
      });
    });

    if (earliestJoin > todayStr) earliestJoin = todayStr;

    const getDaysDiff = (startStr: string, endStr: string) => {
      const [sy, sm, sd] = startStr.split("-").map(Number);
      const [ey, em, ed] = endStr.split("-").map(Number);
      const s = Date.UTC(sy, sm - 1, sd);
      const e = Date.UTC(ey, em - 1, ed);
      return Math.round((e - s) / (1000 * 3600 * 24));
    };

    const totalDays = getDaysDiff(earliestJoin, todayStr);

    let granularity: "day" | "week" | "month" = "day";
    let fromStr = earliestJoin;

    if (range === "daily") {
      granularity = "day";
      fromStr = todayStr;
    } else {
      if (totalDays > 180) {
        granularity = "month";
      } else if (totalDays > 45) {
        granularity = "week";
      } else {
        granularity = "day";
      }
    }

    const multiYear = fromStr.slice(0, 4) !== todayStr.slice(0, 4);

    // Map a date string YYYY-MM-DD to its bucket key and display label
    const getBucketInfo = (dateStr: string) => {
      if (granularity === "month") {
        const key = dateStr.slice(0, 7); // YYYY-MM
        const [y, m] = key.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, 1));
        const label = dt.toLocaleDateString("en-US", {
          timeZone: "UTC",
          month: "short",
          year: "numeric",
        });
        return { key, label };
      }
      if (granularity === "week") {
        const [y, m, d] = dateStr.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        const day = dt.getUTCDay();
        const diff = dt.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(Date.UTC(y, m - 1, diff)).toISOString().slice(0, 10);
        const [my, mm, md] = monday.split("-").map(Number);
        const mdt = new Date(Date.UTC(my, mm - 1, md));
        const label = mdt.toLocaleDateString("en-US", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return { key: monday, label: `Week of ${label}` };
      }
      // day
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      const label = range === "daily"
        ? dt.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" })
        : dt.toLocaleDateString("en-US", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          ...(multiYear ? { year: "numeric" } : {}),
        });
      return { key: dateStr, label };
    };

    const HOURLY_SLOTS = [
      { key: "00:00", label: "12 AM" },
      { key: "03:00", label: "3 AM" },
      { key: "06:00", label: "6 AM" },
      { key: "09:00", label: "9 AM" },
      { key: "12:00", label: "12 PM" },
      { key: "15:00", label: "3 PM" },
      { key: "18:00", label: "6 PM" },
      { key: "21:00", label: "9 PM" },
    ];

    const daysMap: Record<
      string,
      {
        day: string;
        date: string;
        assigned: number;
        active: number;
        completed: number;
        userCounts: Record<string, number>;
        membersMap: Record<string, MemberDayBreakdown>;
      }
    > = {};

    if (range === "daily") {
      HOURLY_SLOTS.forEach((slot) => {
        const initialUserCounts: Record<string, number> = {};
        visibleMembers.forEach((m) => {
          initialUserCounts[m.userId] = 0;
        });
        daysMap[slot.key] = {
          day: slot.label,
          date: slot.key,
          assigned: 0,
          active: 0,
          completed: 0,
          userCounts: initialUserCounts,
          membersMap: {},
        };
      });
    } else if (granularity === "month") {
      let [sy, sm] = fromStr.slice(0, 7).split("-").map(Number);
      const [ey, em] = todayStr.slice(0, 7).split("-").map(Number);

      while (sy < ey || (sy === ey && sm <= em)) {
        const mKey = `${sy}-${String(sm).padStart(2, "0")}`;
        const dt = new Date(Date.UTC(sy, sm - 1, 1));
        const label = dt.toLocaleDateString("en-US", {
          timeZone: "UTC",
          month: "short",
          year: "numeric",
        });
        const initialUserCounts: Record<string, number> = {};
        visibleMembers.forEach((m) => {
          initialUserCounts[m.userId] = 0;
        });
        daysMap[mKey] = {
          day: label,
          date: mKey,
          assigned: 0,
          active: 0,
          completed: 0,
          userCounts: initialUserCounts,
          membersMap: {},
        };
        sm++;
        if (sm > 12) {
          sm = 1;
          sy++;
        }
      }
    } else {
      for (let d = fromStr; d <= todayStr; d = addDay(d, 1)) {
        const { key, label } = getBucketInfo(d);
        if (!daysMap[key]) {
          const initialUserCounts: Record<string, number> = {};
          visibleMembers.forEach((m) => {
            initialUserCounts[m.userId] = 0;
          });
          daysMap[key] = {
            day: label,
            date: key,
            assigned: 0,
            active: 0,
            completed: 0,
            userCounts: initialUserCounts,
            membersMap: {},
          };
        }
      }
    }

    const userBucketCards: Record<string, Record<string, Set<string>>> = {};
    const userBreakdowns: Record<string, Record<string, { completed: number; active: number; assigned: number }>> = {};

    const countOnDay = (
      dateObj: Date,
      field: "assigned" | "active" | "completed",
      uId: string,
      name: string,
      cardId?: string
    ) => {
      let bucketKey = "";
      if (range === "daily") {
        const dStr = dayKey(dateObj, tzOffsetMin);
        if (dStr !== todayStr) return;
        const localTime = new Date(dateObj.getTime() - tzOffsetMin * 60_000);
        const hour = localTime.getUTCHours();
        const slotIdx = Math.floor(hour / 3);
        bucketKey = HOURLY_SLOTS[Math.min(slotIdx, HOURLY_SLOTS.length - 1)].key;
      } else {
        const dStr = dayKey(dateObj, tzOffsetMin);
        bucketKey = getBucketInfo(dStr).key;
      }

      const bucket = daysMap[bucketKey];
      if (!bucket) return;
      bucket[field] += 1;

      if (cardId) {
        if (!userBucketCards[bucketKey]) userBucketCards[bucketKey] = {};
        if (!userBucketCards[bucketKey][uId]) userBucketCards[bucketKey][uId] = new Set();
        userBucketCards[bucketKey][uId].add(cardId);
      }

      if (!userBreakdowns[bucketKey]) userBreakdowns[bucketKey] = {};
      if (!userBreakdowns[bucketKey][uId]) {
        userBreakdowns[bucketKey][uId] = { completed: 0, active: 0, assigned: 0 };
      }
      userBreakdowns[bucketKey][uId][field] += 1;

      if (!bucket.membersMap[name]) {
        bucket.membersMap[name] = { userName: name, assigned: 0, active: 0, completed: 0 };
      }
      bucket.membersMap[name][field] += 1;
    };

    targetCards.forEach((card) => {
      card.assignments.forEach((a) => {
        const uId = a.userId;
        if (!isAdmin && uId !== userId) return;
        if (scopedUserId && uId !== scopedUserId) return;
        const name = a.userName || "Member";
        countOnDay(a.createdAt, "assigned", uId, name, card.id);
        if (card.status === "DONE") countOnDay(card.updatedAt, "completed", uId, name, card.id);
        else if (isActiveCard(card)) countOnDay(card.updatedAt, "active", uId, name, card.id);
      });
    });

    const dailyTrends = Object.values(daysMap).map((item) => {
      const userCounts: Record<string, number> = {};
      const userDetails: Record<string, { total: number; completed: number; active: number; pending: number }> = {};
      const bucketCardMap = userBucketCards[item.date] || {};
      const bucketBreakdownMap = userBreakdowns[item.date] || {};

      visibleMembers.forEach((m) => {
        const uId = m.userId;
        const total = bucketCardMap[uId]?.size || 0;
        const completed = bucketBreakdownMap[uId]?.completed || 0;
        const active = bucketBreakdownMap[uId]?.active || 0;
        const pending = Math.max(0, total - completed - active);

        userCounts[uId] = total;
        userDetails[uId] = { total, completed, active, pending };
      });

      Object.keys(item.userCounts).forEach((uId) => {
        if (userCounts[uId] === undefined) {
          const total = bucketCardMap[uId]?.size || 0;
          const completed = bucketBreakdownMap[uId]?.completed || 0;
          const active = bucketBreakdownMap[uId]?.active || 0;
          const pending = Math.max(0, total - completed - active);
          userCounts[uId] = total;
          userDetails[uId] = { total, completed, active, pending };
        }
      });

      const pending = Math.max(0, item.assigned - item.completed - item.active);
      const total = item.completed + item.active + pending;

      return {
        day: item.day,
        date: item.date,
        assigned: item.assigned,
        active: item.active,
        completed: item.completed,
        pending,
        total,
        ...userCounts,
        userDetails,
        members: Object.values(item.membersMap),
      };
    });

    let compareTrends: Array<{
      day: string;
      date: string;
      totalA: number;
      totalB: number;
      completedA: number;
      completedB: number;
      activeA: number;
      activeB: number;
      pendingA: number;
      pendingB: number;
    }> = [];

    if (isAdmin && compareUserId && effectiveTargetUserId) {
      const cardsForA = allCards.filter((c) =>
        c.assignments.some((a) => a.userId === effectiveTargetUserId)
      );
      const cardsForB = allCards.filter((c) => c.assignments.some((a) => a.userId === compareUserId));

      const compareBucketKeys = Object.keys(daysMap);

      compareTrends = compareBucketKeys.map((bKey) => {
        const tally = (
          cards: typeof allCards,
          uid: string
        ) => {
          const cardIds = new Set<string>();
          let completed = 0;
          let active = 0;
          cards.forEach((c) => {
            c.assignments.forEach((a) => {
              if (a.userId !== uid) return;
              if (range === "daily") {
                const aDateStr = dayKey(a.createdAt, tzOffsetMin);
                if (aDateStr === todayStr) {
                  const localTime = new Date(a.createdAt.getTime() - tzOffsetMin * 60_000);
                  const hour = localTime.getUTCHours();
                  const slotIdx = Math.floor(hour / 3);
                  const slotKey = HOURLY_SLOTS[Math.min(slotIdx, HOURLY_SLOTS.length - 1)].key;
                  if (slotKey === bKey) cardIds.add(c.id);
                }
                const uDateStr = dayKey(c.updatedAt, tzOffsetMin);
                if (uDateStr === todayStr) {
                  const localTime = new Date(c.updatedAt.getTime() - tzOffsetMin * 60_000);
                  const hour = localTime.getUTCHours();
                  const slotIdx = Math.floor(hour / 3);
                  const slotKey = HOURLY_SLOTS[Math.min(slotIdx, HOURLY_SLOTS.length - 1)].key;
                  if (slotKey === bKey) {
                    cardIds.add(c.id);
                    if (c.status === "DONE") completed += 1;
                    else if (isActiveCard(c)) active += 1;
                  }
                }
              } else {
                const aCreatedBucket = getBucketInfo(dayKey(a.createdAt, tzOffsetMin)).key;
                if (aCreatedBucket === bKey) cardIds.add(c.id);
                const updatedBucket = getBucketInfo(dayKey(c.updatedAt, tzOffsetMin)).key;
                if (updatedBucket === bKey) {
                  cardIds.add(c.id);
                  if (c.status === "DONE") completed += 1;
                  else if (isActiveCard(c)) active += 1;
                }
              }
            });
          });
          const total = cardIds.size;
          const pending = Math.max(0, total - completed - active);
          return { total, completed, active, pending };
        };

        const a = tally(cardsForA, effectiveTargetUserId);
        const b = tally(cardsForB, compareUserId);

        return {
          day: daysMap[bKey]?.day || bKey,
          date: bKey,
          totalA: a.total,
          totalB: b.total,
          completedA: a.completed,
          completedB: b.completed,
          activeA: a.active,
          activeB: b.active,
          pendingA: a.pending,
          pendingB: b.pending,
        };
      });
    }

    const totalAssigned =
      range === "overall"
        ? targetCards.length
        : targetCards.filter((c) => c.assignments.some((a) => dayKey(a.createdAt, tzOffsetMin) === todayStr)).length;
    const totalActive =
      range === "overall"
        ? targetCards.filter((c) => isActiveCard(c)).length
        : targetCards.filter((c) => isActiveCard(c) && dayKey(c.updatedAt, tzOffsetMin) === todayStr).length;
    const totalCompleted =
      range === "overall"
        ? targetCards.filter((c) => c.status === "DONE").length
        : targetCards.filter((c) => c.status === "DONE" && dayKey(c.updatedAt, tzOffsetMin) === todayStr).length;

    return NextResponse.json({
      success: true,
      isAdmin,
      range,
      granularity,
      currentUserId: userId,
      currentAdminName,
      fromDate: fromStr,
      toDate: todayStr,
      allMembers: visibleMembers,
      dailyTrends,
      compareTrends: isAdmin ? compareTrends : [],
      memberStats: visibleMembers,
      metrics: {
        totalAssigned,
        totalActive,
        totalCompleted,
        totalMembers: visibleMembers.length,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics/daily-activity error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
