import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { liveblocks } from "@/lib/liveblocks-server";

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth();
    const { searchParams } = new URL(req.url);
    const queryOrgId = searchParams.get("orgId") || orgId;

    if (!userId || !queryOrgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await (db as any).orgSettings.findUnique({
      where: { orgId: queryOrgId },
    });

    return NextResponse.json({
      success: true,
      autoFolderCreation: settings?.autoFolderCreation ?? true,
    });
  } catch (error) {
    console.error("[ORG_SETTINGS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, orgId, orgRole } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only Admin users can change organization settings
    if (orgRole !== "org:admin") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    const body = await req.json();
    const { autoFolderCreation } = body;

    if (typeof autoFolderCreation !== "boolean") {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const settings = await (db as any).orgSettings.upsert({
      where: { orgId },
      update: { autoFolderCreation },
      create: { orgId, autoFolderCreation },
    });

    // Broadcast real-time update event via Liveblocks
    try {
      await liveblocks.broadcastEvent(orgId, {
        type: "ORG_SETTINGS_UPDATED",
        data: {
          orgId,
          autoFolderCreation: settings.autoFolderCreation,
          updatedBy: userId,
        },
      });
    } catch (liveblocksError) {
      console.error("[LIVEBLOCKS_BROADCAST_SETTINGS_ERROR]", liveblocksError);
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("[ORG_SETTINGS_PATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
