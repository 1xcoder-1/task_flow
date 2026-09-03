"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { statusFromListTitle } from "@/lib/card-status";

interface ImportCard {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  subtasks?: { title: string; isCompleted: boolean }[];
  comments?: { userName?: string; text: string }[];
  links?: string[];
  assignments?: { userId?: string; userName?: string; userImage?: string }[];
  tags?: { name: string; color: string }[];
}

interface ImportList {
  title: string;
  cards: ImportCard[];
}

export async function importBoardData({
  boardId,
  listsData,
}: {
  boardId: string;
  listsData: ImportList[];
}) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const board = await db.board.findUnique({
    where: { id: boardId, orgId },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  // Get current last list order
  const lastList = await db.list.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  let startListOrder = lastList ? lastList.order + 1 : 1;

  for (const listInput of listsData) {
    // Reuse existing list by title, or create new one
    let list = await db.list.findFirst({
      where: { boardId, title: listInput.title },
    });

    if (!list) {
      list = await db.list.create({
        data: {
          title: listInput.title,
          boardId,
          order: startListOrder++,
        },
      });
    }

    // Get current last card order for this list
    const lastCard = await db.card.findFirst({
      where: { listId: list.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    let startCardOrder = lastCard ? lastCard.order + 1 : 1;
    const inferredStatus = statusFromListTitle(list.title);

    for (const cardInput of listInput.cards || []) {
      if (!cardInput.title) continue;

      // Resolve status: use imported status if valid, otherwise infer from list title
      const validStatuses = ["PENDING", "IN_PROGRESS", "DONE"];
      const resolvedStatus =
        cardInput.status && validStatuses.includes(cardInput.status.toUpperCase())
          ? cardInput.status.toUpperCase()
          : inferredStatus.status;

      // Resolve dueDate
      let resolvedDueDate: Date | null = null;
      if (cardInput.dueDate) {
        const d = new Date(cardInput.dueDate);
        if (!isNaN(d.getTime())) resolvedDueDate = d;
      }

      // Resolve priority
      const validPriorities = ["High", "Medium", "Low"];
      const resolvedPriority =
        cardInput.priority &&
        validPriorities.some(
          (p) => p.toLowerCase() === cardInput.priority!.toLowerCase()
        )
          ? validPriorities.find(
              (p) => p.toLowerCase() === cardInput.priority!.toLowerCase()
            )!
          : null;

      const card = await db.card.create({
        data: {
          title: cardInput.title,
          description: cardInput.description || "",
          listId: list.id,
          order: startCardOrder++,
          status: resolvedStatus,
          isActive: inferredStatus.isActive,
          ...(resolvedDueDate ? { dueDate: resolvedDueDate } : {}),
          ...(resolvedPriority ? { priority: resolvedPriority } : {}),
        },
      });

      // Create Subtasks
      if (Array.isArray(cardInput.subtasks) && cardInput.subtasks.length > 0) {
        await Promise.all(
          cardInput.subtasks.flatMap((st: any) =>
            st?.title
              ? [
                  db.subtask.create({
                    data: {
                      title: st.title,
                      isCompleted: Boolean(st.isCompleted),
                      cardId: card.id,
                    },
                  }),
                ]
              : []
          )
        );
      }

      // Create Comments
      if (Array.isArray(cardInput.comments) && cardInput.comments.length > 0) {
        await Promise.all(
          cardInput.comments.flatMap((cm: any) =>
            cm?.text
              ? [
                  db.comment.create({
                    data: {
                      text: cm.text,
                      userName: cm.userName || "Imported Member",
                      userImage: "/placeholder-user.png",
                      cardId: card.id,
                      userId,
                    },
                  }),
                ]
              : []
          )
        );
      }

      // Create Web Links / Attachments
      if (Array.isArray(cardInput.links) && cardInput.links.length > 0) {
        await Promise.all(
          cardInput.links.flatMap((linkUrl: string) =>
            linkUrl
              ? [
                  db.attachment.create({
                    data: {
                      title: "Web Link",
                      url: linkUrl,
                      type: "link",
                      cardId: card.id,
                    },
                  }),
                ]
              : []
          )
        );
      }

      // Create Tags — find or create each tag in the org, then link to card
      if (Array.isArray(cardInput.tags) && cardInput.tags.length > 0) {
        for (const tagInput of cardInput.tags) {
          if (!tagInput?.name) continue;
          // Find existing tag in org with same name (case-insensitive)
          let tag = await (db as any).tag.findFirst({
            where: {
              orgId,
              name: { equals: tagInput.name, mode: "insensitive" },
            },
          });
          // If not found, create it
          if (!tag) {
            tag = await (db as any).tag.create({
              data: {
                name: tagInput.name,
                color: tagInput.color || "#6366f1",
                orgId,
              },
            });
          }
          // Link tag to card (ignore if already linked)
          await (db as any).cardTag.upsert({
            where: { cardId_tagId: { cardId: card.id, tagId: tag.id } },
            create: { cardId: card.id, tagId: tag.id },
            update: {},
          });
        }
      }

      // Create Assignments — restore using exported userId (works for same-org re-imports)
      if (Array.isArray(cardInput.assignments) && cardInput.assignments.length > 0) {
        await Promise.all(
          cardInput.assignments.flatMap((asgn: any) =>
            asgn?.userId
              ? [
                  db.cardAssignment.upsert({
                    where: { cardId_userId: { cardId: card.id, userId: asgn.userId } },
                    create: {
                      cardId: card.id,
                      userId: asgn.userId,
                      userName: asgn.userName || "Member",
                      userImage: asgn.userImage || "/placeholder-user.png",
                    },
                    update: {
                      userName: asgn.userName || "Member",
                      userImage: asgn.userImage || "/placeholder-user.png",
                    },
                  }),
                ]
              : []
          )
        );
      }
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { success: true };
}
