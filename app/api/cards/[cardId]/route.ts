import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toPublicAttachment } from "@/lib/attachments";

export const dynamic = "force-dynamic";

type AttachmentRow = {
  id: string;
  type: string;
  title: string | null;
  url: string | null;
  cardId: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const { cardId } = await params;
    const { userId, orgId } = await auth();

    if (!userId || !orgId)
      return new NextResponse("Unauthorized", { status: 401 });

    const card = await db.card.findUnique({
      where: {
        id: cardId,
        list: {
          board: {
            orgId,
          },
        },
      },
      include: {
        list: {
          select: {
            title: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
        },
        assignments: true,
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!card) return NextResponse.json(card);

    let attachmentRows: AttachmentRow[] = [];
    try {
      attachmentRows = await db.$queryRaw<AttachmentRow[]>(Prisma.sql`
        SELECT
          id,
          type,
          title,
          "cardId",
          "createdAt",
          "updatedAt",
          CASE
            WHEN type = 'link' THEN url
            WHEN url LIKE 'http%' THEN url
            WHEN url LIKE '/api/files/%' THEN url
            ELSE NULL
          END AS url
        FROM "Attachment"
        WHERE "cardId" = ${cardId}
        ORDER BY "createdAt" DESC
      `);
    } catch {
      const fallback = await db.attachment.findMany({
        where: { cardId },
        orderBy: { createdAt: "desc" },
      });
      attachmentRows = fallback.map((attachment) => ({
        ...attachment,
        url:
          attachment.type === "link" || attachment.url.startsWith("http") || attachment.url.startsWith("/api/files/")
            ? attachment.url
            : null,
      }));
    }

    return NextResponse.json({
      ...card,
      attachments: attachmentRows.map((attachment) =>
        toPublicAttachment({
          ...attachment,
          url: attachment.url || `/api/files/${attachment.id}`,
        })
      ),
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
