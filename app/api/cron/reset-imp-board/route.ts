import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Calculate the date 24 hours ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all IMP boards
    const impBoards = await db.board.findMany({
      where: {
        OR: [
          { isImpBoard: true },
          { title: "Imp Tasks daily" }
        ],
      },
      select: {
        id: true,
      }
    });

    const impBoardIds = impBoards.map((b) => b.id);

    if (impBoardIds.length === 0) {
      return NextResponse.json({ message: "No IMP boards found." });
    }

    // Delete cards on these boards that are older than 24 hours
    const deletedCards = await db.card.deleteMany({
      where: {
        list: {
          boardId: {
            in: impBoardIds,
          },
        },
        createdAt: {
          lt: yesterday,
        },
      },
    });

    return NextResponse.json({ 
      message: "Successfully reset IMP boards.", 
      deletedCount: deletedCards.count 
    });
  } catch (error) {
    console.error("Failed to reset IMP boards:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
