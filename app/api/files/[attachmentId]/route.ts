import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthorizedAttachment } from "@/lib/attachments";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const { attachmentId } = await params;
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const attachment = await getAuthorizedAttachment(attachmentId, orgId);

    if (!attachment) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (attachment.url.startsWith("data:")) {
      const comma = attachment.url.indexOf(",");
      const header = attachment.url.slice(0, Math.max(0, comma));
      const data = comma >= 0 ? attachment.url.slice(comma + 1) : "";
      const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
      const buffer = Buffer.from(data, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.title || "attachment")}"`,
          "Cache-Control": "private, max-age=31536000, immutable",
        },
      });
    }

    if (attachment.url.startsWith("http://") || attachment.url.startsWith("https://")) {
      return NextResponse.redirect(attachment.url);
    }

    return new NextResponse("Not found", { status: 404 });
  } catch (error) {
    console.error("Failed to serve attachment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
