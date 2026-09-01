import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const COLORS = [
  "#E57373",
  "#9575CD",
  "#4FC3F7",
  "#81C784",
  "#FFF176",
  "#FF8A65",
  "#F06292",
  "#7986CB",
];

export async function POST(request: Request) {
  try {
    const { userId, orgId, sessionClaims } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { room } = await request.json();
    if (typeof room !== "string") {
      return new NextResponse("Invalid room", { status: 400 });
    }

    const isOrganizationRoom = room === orgId;

    if (!isOrganizationRoom) {
      const board = await db.board.findUnique({
        where: { id: room },
        select: { orgId: true },
      });

      if (board?.orgId !== orgId) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const claims = sessionClaims as {
      first_name?: string;
      last_name?: string;
      name?: string;
      email?: string;
      image_url?: string;
      picture?: string;
    } | null;

    const userName =
      claims?.name ||
      [claims?.first_name, claims?.last_name].filter(Boolean).join(" ") ||
      claims?.email ||
      "User";
    const userAvatar = claims?.image_url || claims?.picture || undefined;

    const colorIndex =
      Math.abs(userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
      COLORS.length;

    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        avatar: userAvatar,
        color: COLORS[colorIndex],
      },
    });

    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new NextResponse(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse(JSON.stringify({ error: "Auth failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
