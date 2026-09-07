import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDailyAnalyticsData } from "@/lib/get-daily-analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId, orgRole } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "";
    const targetUserId = searchParams.get("targetUserId");
    const compareUserId = searchParams.get("compareUserId");
    const range = searchParams.get("range") === "overall" ? "overall" : "daily";
    const tzOffsetMin = Number(searchParams.get("tzOffset") ?? 0) || 0;
    const localDate = searchParams.get("localDate");

    const data = await getDailyAnalyticsData({
      orgId,
      userId,
      orgRole,
      targetUserId,
      compareUserId,
      range,
      tzOffsetMin,
      localDate,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Daily analytics API error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
