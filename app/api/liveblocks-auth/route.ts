import { Liveblocks } from "@liveblocks/node";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Try to get current user with a fast 1s timeout to avoid blocking Liveblocks auth
    let user: any = null;
    try {
      user = await Promise.race([
        currentUser(),
        new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);
    } catch (e) {
      console.warn("Clerk currentUser fetch failed during Liveblocks auth:", e);
    }

    const userName = user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : (sessionClaims as any)?.name || (sessionClaims as any)?.email || "User";

    const userAvatar = user?.imageUrl || (sessionClaims as any)?.picture || null;

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

    session.allow(`*`, session.FULL_ACCESS);

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
