import { inngest } from "./client";
import { sendDiscordNotification } from "@/lib/discord";
import { db } from "@/lib/db";

export const sendNotification = inngest.createFunction(
  {
    id: "send-discord-notification",
    triggers: [{ event: "app/notification.send" }]
  },
  async ({ event, step }) => {
    // 1. Try to send the Discord notification — failure is non-fatal
    await step.run("send-to-discord", async () => {
      let assignedByName = "A teammate";
      if (event.data.assignedById) {
        try {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          const user = await client.users.getUser(event.data.assignedById);
          if (user) {
            assignedByName = `${user.firstName || ""}${user.lastName ? ` ${user.lastName}` : ''}`.trim() || "A teammate";
          }
        } catch (e) {
          console.error("Failed to fetch assignedBy user", e);
        }
      }

      try {
        await sendDiscordNotification(
          event.data.taskTitle,
          event.data.assignedToName,
          assignedByName
        );
      } catch (e) {
        // Discord is optional — log and continue so the in-app notification still works
        console.error("Discord notification failed (non-fatal):", e);
      }
    });

    // 2. Always update the notification record to 'sent' (in-app delivery succeeded)
    await step.run("update-notification-status", async () => {
      await db.notification.update({
        where: { id: event.data.notificationId },
        data: { status: "sent", sentAt: new Date() }
      });
    });

    return { success: true };
  }
);


export const logActivity = inngest.createFunction(
  {
    id: "log-activity",
    triggers: [{ event: "app/audit.log" }]
  },
  async ({ event, step }) => {
    await step.run("create-audit-log-db", async () => {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      let userImage = event.data.userImage;
      let userName = event.data.userName;
      
      try {
        const user = await client.users.getUser(event.data.userId);
        if (user) {
          userImage = user.imageUrl || null;
          userName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`;
        }
      } catch (e) {
        console.error("Failed to fetch user from clerk", e);
      }

      await db.auditLog.create({
        data: {
          orgId: event.data.orgId,
          entityId: event.data.entityId,
          entityType: event.data.entityType,
          entityTitle: event.data.entityTitle,
          action: event.data.action,
          userId: event.data.userId,
          userImage: userImage,
          userName: userName,
        },
      });
    });
    return { success: true };
  }
);

export * from './functions/boards';
export * from './functions/folders';
export * from './functions/lists';
export * from './functions/comments';