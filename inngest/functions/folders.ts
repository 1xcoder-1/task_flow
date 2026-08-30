import { inngest } from "../client";
import { db } from "@/lib/db";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

export const handleFolderCreate = inngest.createFunction(
  {
    id: "handle-folder-create",
    triggers: [{ event: "app/folder.create" }]
  },
  async ({ event, step }) => {
    // 1. Create audit log for the team folder
    await step.run("create-team-folder-audit-log", async () => {
      let userImage = "";
      let userName = "Unknown";
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(event.data.userId);
        userImage = user?.imageUrl || "";
        userName = `${user?.firstName || ""}${user?.lastName ? ` ${user.lastName}` : ''}`.trim() || "Unknown";
      } catch (error) {
        console.error("Failed to fetch user from Clerk", error);
      }

      await db.auditLog.create({
        data: {
          orgId: event.data.orgId,
          entityId: event.data.folderId,
          entityType: ENTITY_TYPE.FOLDER,
          entityTitle: event.data.folderTitle,
          action: ACTION.CREATE,
          userId: event.data.userId,
          userImage,
          userName,
        },
      });
    });

    // 2. Auto-generate Year -> Month -> Day structure
    await step.run("auto-generate-nested-folders", async () => {
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const currentMonth = now.toLocaleString("default", { month: "long" });
      const currentDay = now.getDate().toString();

      // Create Year Folder
      let yearFolder = await db.yearFolder.findFirst({
        where: { title: currentYear, folderId: event.data.folderId }
      });
      
      if (!yearFolder) {
        yearFolder = await db.yearFolder.create({
          data: {
            title: currentYear,
            folderId: event.data.folderId,
          },
        });
      }

      // Create Month Folder
      let monthFolder = await db.monthFolder.findFirst({
        where: { title: currentMonth, yearFolderId: yearFolder.id }
      });
      
      if (!monthFolder) {
        monthFolder = await db.monthFolder.create({
          data: {
            title: currentMonth,
            yearFolderId: yearFolder.id,
          },
        });
      }

      // Create Day Folder
      let dayFolder = await db.dayFolder.findFirst({
        where: { title: currentDay, monthFolderId: monthFolder.id }
      });
      
      if (!dayFolder) {
        dayFolder = await db.dayFolder.create({
          data: {
            title: currentDay,
            monthFolderId: monthFolder.id,
          },
        });
      }
      
      return dayFolder.id;
    });

    // 3. Create the Daily Tasks Board
    await step.run("auto-generate-daily-tasks-board", async () => {
      // Find the day folder we just created or fetch it
      const dayFolder = await db.dayFolder.findFirst({
        where: {
          monthFolder: {
            yearFolder: {
              folderId: event.data.folderId
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!dayFolder) return;

      const existingBoard = await db.board.findFirst({
        where: { title: "Daily Tasks", dayFolderId: dayFolder.id }
      });

      if (existingBoard) return;

      const board = await db.board.create({
        data: {
          title: "Daily Tasks",
          orgId: event.data.orgId,
          dayFolderId: dayFolder.id,
          imageId: "default",
          imageThumbUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=400&auto=format&fit=crop",
          imageFullUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1080&auto=format&fit=crop",
          imageUserName: "System",
          imageLinkHtml: "System",
          lists: {
            create: [
              { title: "Pending", order: 1 },
              { title: "In Progress", order: 2 },
              { title: "Done", order: 3 }
            ]
          }
        }
      });
      
      // Log Daily Tasks board creation
      let userImage = "";
      let userName = "Unknown";
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(event.data.userId);
        userImage = user?.imageUrl || "";
        userName = `${user?.firstName || ""}${user?.lastName ? ` ${user.lastName}` : ''}`.trim() || "Unknown";
      } catch (error) {
        console.error("Failed to fetch user from Clerk", error);
      }

      await db.auditLog.create({
        data: {
          orgId: event.data.orgId,
          entityId: board.id,
          entityType: ENTITY_TYPE.BOARD,
          entityTitle: board.title,
          action: ACTION.CREATE,
          userId: event.data.userId,
          userImage,
          userName,
        },
      });
    });

    return { success: true };
  }
);

export const handleOrgInit = inngest.createFunction(
  {
    id: "handle-org-init",
    triggers: [{ event: "app/org.init" }]
  },
  async ({ event, step }) => {
    await step.run("auto-generate-important-folder", async () => {
      const orgId = event.data.orgId;
      
      const impFolderExists = await db.folder.findFirst({
        where: { orgId, title: "Important" }
      });

      if (!impFolderExists) {
        const currentYear = new Date().getFullYear().toString();
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentDay = new Date().getDate().toString();

        const newImpFolder = await db.folder.create({
          data: {
            title: "Important",
            orgId,
          }
        });
        
        const yearFolder = await db.yearFolder.create({
          data: { title: currentYear, folderId: newImpFolder.id }
        });
        const monthFolder = await db.monthFolder.create({
          data: { title: currentMonth, yearFolderId: yearFolder.id }
        });
        const dayFolder = await db.dayFolder.create({
          data: { title: currentDay, monthFolderId: monthFolder.id }
        });
        await db.board.create({
          data: {
            title: "Imp Tasks daily",
            orgId,
            dayFolderId: dayFolder.id,
            isImpBoard: true,
            imageId: "default",
            imageThumbUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=400&auto=format&fit=crop",
            imageFullUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1080&auto=format&fit=crop",
            imageUserName: "System",
            imageLinkHtml: "System",
            lists: {
              create: [
                { title: "Pending", order: 1 },
                { title: "In Progress", order: 2 },
                { title: "Done", order: 3 }
              ]
            }
          }
        });
      }
    });
    return { success: true };
  }
);

export const handleFolderInit = inngest.createFunction(
  {
    id: "handle-folder-init",
    triggers: [{ event: "app/folder.init" }]
  },
  async ({ event, step }) => {
    await step.run("auto-generate-folder-structure", async () => {
      const orgId = event.data.orgId;
      const folderId = event.data.folderId;
      
      const currentYear = new Date().getFullYear().toString();
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentDay = new Date().getDate().toString();

      let yearFolder = await db.yearFolder.findFirst({
        where: { folderId, title: currentYear }
      });
      
      if (!yearFolder) {
        yearFolder = await db.yearFolder.create({
          data: { title: currentYear, folderId }
        });
      }

      let monthFolder = await db.monthFolder.findFirst({
        where: { title: currentMonth, yearFolderId: yearFolder.id }
      });
      
      if (!monthFolder) {
        monthFolder = await db.monthFolder.create({
          data: { title: currentMonth, yearFolderId: yearFolder.id }
        });
      }

      let dayFolder = await db.dayFolder.findFirst({
        where: { title: currentDay, monthFolderId: monthFolder.id }
      });
      
      if (!dayFolder) {
        dayFolder = await db.dayFolder.create({
          data: { title: currentDay, monthFolderId: monthFolder.id }
        });
        
        await db.board.create({
          data: {
            title: "Daily Tasks",
            orgId,
            dayFolderId: dayFolder.id,
            imageId: "default",
            imageThumbUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=400&auto=format&fit=crop",
            imageFullUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1080&auto=format&fit=crop",
            imageUserName: "System",
            imageLinkHtml: "System",
            lists: {
              create: [
                { title: "Pending", order: 1 },
                { title: "In Progress", order: 2 },
                { title: "Done", order: 3 }
              ]
            }
          }
        });
      }
    });
    return { success: true };
  }
);
