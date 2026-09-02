"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-day-folder/types";
import { CreateDayFolder } from "@/actions/create-day-folder/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { title, monthFolderId } = data;

  let dayFolder;

  try {
    // 1. Fetch parent month & year details to enforce exact calendar boundaries
    const monthFolder = await db.monthFolder.findUnique({
      where: { id: monthFolderId },
      include: { yearFolder: true }
    });

    if (monthFolder) {
      const year = parseInt(monthFolder.yearFolder?.title || new Date().getFullYear().toString(), 10);
      const monthNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
      ];
      const monthIndex = monthNames.indexOf(monthFolder.title.toLowerCase());

      if (monthIndex !== -1) {
        // Get exact maximum days in this specific month & year (handles leap years & 28/30/31 days)
        const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const requestedDayNum = parseInt(title, 10);

        if (!isNaN(requestedDayNum) && (requestedDayNum < 1 || requestedDayNum > maxDaysInMonth)) {
          return {
            error: `Invalid day! ${monthFolder.title} ${year} only has ${maxDaysInMonth} days.`
          };
        }
      }
    }

    dayFolder = await db.dayFolder.create({
      data: {
        title,
        monthFolderId,
      },
    });

    await createAuditLog({
      entityId: dayFolder.id,
      entityTitle: dayFolder.title,
      entityType: ENTITY_TYPE.FOLDER,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: dayFolder };
};

export const createDayFolder = createSafeAction(CreateDayFolder, handler);
