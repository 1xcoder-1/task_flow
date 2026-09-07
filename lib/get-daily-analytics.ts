import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

function dayKey(date: Date, tzOffsetMin: number) {
  return new Date(date.getTime() - tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

function isActiveCard(card: { status: string; isActive: boolean }) {
  return card.status === "IN_PROGRESS" || card.isActive;
}

export type MemberStat = {
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

export type MemberDayBreakdown = {
  userName: string;
  assigned: number;
  active: number;
  completed: number;
};

// In-memory cache for Clerk memberships (5 min TTL) to avoid slow external network calls on every request
const membershipCache = new Map<string, { timestamp: number; memberships: any[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedMemberships(orgId: string) {
  const cached = membershipCache.get(orgId);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.memberships;
  }

  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });
    const memberships = Array.isArray(res) ? res : (res as any)?.data || [];
    membershipCache.set(orgId, { timestamp: now, memberships });
    return memberships;
  } catch (err) {
    console.error("Clerk membership fetch error:", err);
    return cached?.memberships || [];
  }
}

interface AnalyticsOptions {
  orgId: string;
  userId: string;
  orgRole?: string | null;
  targetUserId?: string | null;
  compareUserId?: string | null;
  range?: "daily" | "overall";
  tzOffsetMin?: number;
  localDate?: string | null;
}

export async function getDailyAnalyticsData(options: AnalyticsOptions) {
  const {
    orgId,
    userId,
    orgRole,
    range = "daily",
    tzOffsetMin = 0,
  } = options;

  let targetUserId = options.targetUserId;
  let compareUserId = options.compareUserId;
  const todayStr = options.localDate || dayKey(new Date(), tzOffsetMin);
  const isAdmin = orgRole === "org:admin";

  if (!isAdmin) {
    targetUserId = userId;
  }

  // Parallelize DB cards lookup and Clerk memberships lookup
  const [rawCards, memberships, orgAuditLogs] = await Promise.all([
    db.card.findMany({
      where: {
        isArchived: false,
        ...(orgId ? { list: { board: { orgId } } } : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assignments: {
          select: {
            userId: true,
            userName: true,
            userImage: true,
            createdAt: true,
          },
        },
        list: {
          select: {
            title: true,
            board: {
              select: {
                title: true,
                isImpBoard: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    orgId ? getCachedMemberships(orgId) : Promise.resolve([]),
    orgId
      ? db.auditLog.findMany({
          where: { orgId },
          select: { userId: true, userName: true, userImage: true },
          distinct: ["userId"],
        })
      : Promise.resolve([]),
  ]);

  const allCards = rawCards.filter((card) => Boolean(card.assignments && card.assignments.length > 0));
  const memberMap: Record<string, MemberStat> = {};

  if (orgId) {
    for (const mem of memberships) {
      const uId = mem.publicUserData?.userId || mem.userId;
      if (!uId) continue;

      const fullName = [mem.publicUserData?.firstName, mem.publicUserData?.lastName]
        .filter(Boolean)
        .join(" ");
      const identifier = mem.publicUserData?.identifier || mem.publicUserData?.emailAddress || "Member";
      const name = fullName.trim() ? fullName : identifier;

      const isMemAdmin = mem.role === "org:admin" || uId === userId;
      const joinedAt = mem.createdAt ? dayKey(new Date(mem.createdAt), tzOffsetMin) : undefined;

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
    }

    if (!memberMap[userId]) {
      memberMap[userId] = {
        userId,
        userName: isAdmin ? "Admin" : "Member",
        isAdmin,
        assignedCount: 0,
        activeCount: 0,
        completedCount: 0,
        pendingCount: 0,
      };
    }

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
      sm += 1;
      if (sm > 12) {
        sm = 1;
        sy += 1;
      }
    }
  } else {
    // Days / Weeks
    let curr = fromStr;
    while (curr <= todayStr) {
      const [y, m, d] = curr.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      const label = dt.toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        ...(multiYear ? { year: "numeric" } : {}),
      });
      const initialUserCounts: Record<string, number> = {};
      visibleMembers.forEach((mem) => {
        initialUserCounts[mem.userId] = 0;
      });
      daysMap[curr] = {
        day: label,
        date: curr,
        assigned: 0,
        active: 0,
        completed: 0,
        userCounts: initialUserCounts,
        membersMap: {},
      };
      const nextDt = new Date(Date.UTC(y, m - 1, d + 1));
      curr = nextDt.toISOString().slice(0, 10);
    }
  }

  // Populate data into buckets
  targetCards.forEach((card) => {
    card.assignments.forEach((assignee) => {
      const assignedDay = dayKey(assignee.createdAt, tzOffsetMin);
      const updatedDay = dayKey(card.updatedAt, tzOffsetMin);

      if (range === "daily") {
        if (assignedDay === todayStr || updatedDay === todayStr) {
          const assignHour = new Date(assignee.createdAt.getTime() - tzOffsetMin * 60_000).getUTCHours();
          const updateHour = new Date(card.updatedAt.getTime() - tzOffsetMin * 60_000).getUTCHours();
          
          const assignSlot = HOURLY_SLOTS.reduce((prev, curr) => {
            const slotHour = parseInt(curr.key.split(":")[0]);
            return assignHour >= slotHour ? curr : prev;
          }, HOURLY_SLOTS[0]);

          const updateSlot = HOURLY_SLOTS.reduce((prev, curr) => {
            const slotHour = parseInt(curr.key.split(":")[0]);
            return updateHour >= slotHour ? curr : prev;
          }, HOURLY_SLOTS[0]);

          if (assignedDay === todayStr && daysMap[assignSlot.key]) {
            daysMap[assignSlot.key].assigned += 1;
          }
          if (updatedDay === todayStr && daysMap[updateSlot.key]) {
            if (card.status === "DONE") {
              daysMap[updateSlot.key].completed += 1;
              if (daysMap[updateSlot.key].userCounts[assignee.userId] !== undefined) {
                daysMap[updateSlot.key].userCounts[assignee.userId] += 1;
              }
            } else if (isActiveCard(card)) {
              daysMap[updateSlot.key].active += 1;
            }
          }
        }
      } else {
        const bucketKey = granularity === "month" ? updatedDay.slice(0, 7) : updatedDay;
        if (daysMap[bucketKey]) {
          if (card.status === "DONE") {
            daysMap[bucketKey].completed += 1;
            if (daysMap[bucketKey].userCounts[assignee.userId] !== undefined) {
              daysMap[bucketKey].userCounts[assignee.userId] += 1;
            }
          } else if (isActiveCard(card)) {
            daysMap[bucketKey].active += 1;
          }
        }
        const assignBucketKey = granularity === "month" ? assignedDay.slice(0, 7) : assignedDay;
        if (daysMap[assignBucketKey]) {
          daysMap[assignBucketKey].assigned += 1;
        }
      }
    });
  });

  const dailyTrends = Object.values(daysMap).map((item) => ({
    ...item,
    ...item.userCounts,
  }));

  const metrics = {
    totalAssigned: Object.values(memberMap).reduce((acc, m) => acc + m.assignedCount, 0),
    totalActive: Object.values(memberMap).reduce((acc, m) => acc + m.activeCount, 0),
    totalCompleted: Object.values(memberMap).reduce((acc, m) => acc + m.completedCount, 0),
  };

  return {
    success: true,
    isAdmin,
    range,
    allMembers: visibleMembers,
    dailyTrends,
    compareTrends: [],
    metrics,
  };
}
