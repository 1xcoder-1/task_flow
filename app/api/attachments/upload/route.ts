import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { toPublicAttachment } from "@/lib/attachments";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const cardId = String(form.get("cardId") || "");
    const boardId = String(form.get("boardId") || "");
    const type = String(form.get("type") || "document");
    const title = String(form.get("title") || "Attachment");
    const previewUrl = String(form.get("previewUrl") || "");

    if (!(file instanceof File) || !cardId || !boardId) {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large. Keep uploads under 8 MB." }, { status: 413 });
    }

    const card = await db.card.findUnique({
      where: {
        id: cardId,
        list: { board: { orgId } },
      },
      select: {
        linkedCardId: true,
        list: { select: { boardId: true } },
      },
    });

    if (!card || card.list.boardId !== boardId) {
      return NextResponse.json({ error: "Card not found or unauthorized." }, { status: 404 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;

    const attachment = await db.attachment.create({
      data: {
        url: dataUrl,
        type,
        title: title || file.name || "Attachment",
        cardId,
      },
    });

    if (card.linkedCardId) {
      await db.attachment.create({
        data: {
          url: dataUrl,
          type,
          title: title || file.name || "Attachment",
          cardId: card.linkedCardId,
        },
      });
    }

    return NextResponse.json({
      ...toPublicAttachment(attachment),
      previewUrl: previewUrl || undefined,
    });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json({ error: "Failed to upload." }, { status: 500 });
  }
}
