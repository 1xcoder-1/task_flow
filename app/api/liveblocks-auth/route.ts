import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
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

const getBoardOrganization = unstable_cache(
  (boardId: string) => db.board.findUnique({
    where: { id: boardId },
    select: { orgId: true },
  }),
  ["liveblocks-board-organization"],
  { revalidate: 60 }
);

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
    const board = !isOrganizationRoom
      ? await getBoardOrganization(room)
      : null;

    if (!isOrganizationRoom && board?.orgId !== orgId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId).catch(() => null);

    const claims = sessionClaims as any;
    const userName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.emailAddresses?.[0]?.emailAddress || "User"
      : claims?.name || [claims?.first_name, claims?.last_name].filter(Boolean).join(" ") || claims?.email || "User";
    const userAvatar = user?.imageUrl || claims?.picture || claims?.image_url || null;

    // Generate a random color for the user based on their ID
    const colorIndex = Math.abs(
      userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % COLORS.length;
    const color = COLORS[colorIndex];

    // Create a session for the user
    const session = liveblocks.prepareSession(
      userId,
      {
        userInfo: {
          name: userName,
          avatar: userAvatar,
          color,
        }
      }
    );

    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new NextResponse(body, { status, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse(JSON.stringify({ error: "Auth failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
