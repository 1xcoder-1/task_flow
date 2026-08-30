import { auth } from "@clerk/nextjs/server";
import type { ACTION, ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
type Props = {
  entityId: string;
  entityType: ENTITY_TYPE;
  entityTitle: string;
  action: ACTION;
};

export const createAuditLog = async (props: Props) => {
  try {
    const { orgId, userId } = await auth();

    if (!userId || !orgId) throw new Error("User not found.");

    const { entityId, entityType, entityTitle, action } = props;

    await inngest.send({
      name: "app/audit.log",
      data: {
        orgId,
        entityId,
        entityType,
        entityTitle,
        action,
        userId,
        userImage: null,
        userName: "Unknown",
      },
    });

    revalidatePath(`/organization/${orgId}/activity`);
  } catch (error) {
    console.log(`[AUDIT_LOG_ERROR]`, error);
  }
};
