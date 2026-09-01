import { inngest } from "../client";
import { db } from "@/lib/db";

export const updateCommentUser = inngest.createFunction(
  {
    id: "update-comment-user",
    triggers: [{ event: "app/comment.update_user" }]
  },
  async ({ event, step }) => {
    await step.run("update-comment-user-db", async () => {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      
      let userImage = "";
      let userName = "Unknown User";

      try {
        const user = await client.users.getUser(event.data.userId);
        if (user) {
          userImage = user.imageUrl || "";
          userName = `${user.firstName || ""}${user.lastName ? ` ${user.lastName}` : ''}`.trim() || user.username || user.primaryEmailAddress?.emailAddress || "User";
        }
      } catch (e) {
        console.error("Failed to fetch user from clerk for comment update", e);
      }

      await db.comment.updateMany({
        where: {
          id: {
            in: event.data.commentIds
          }
        },
        data: {
          userImage,
          userName,
        }
      });
    });
    return { success: true };
  }
);
