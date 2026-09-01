-- CreateEnum
CREATE TYPE "ACTION" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ENTITY_TYPE" AS ENUM ('FOLDER', 'BOARD', 'LIST', 'CARD');

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "action" "ACTION" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "ENTITY_TYPE" NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userImage" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "dayFolderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "imageThumbUrl" TEXT NOT NULL,
    "imageFullUrl" TEXT NOT NULL,
    "imageUserName" TEXT NOT NULL,
    "imageLinkHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isImpBoard" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "priority" TEXT,
    "progress" INTEGER DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "listId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkedCardId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardAssignment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userImage" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTag" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "CardTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userImage" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayFolder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "monthFolderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DayFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logoUrl" TEXT,
    "password" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderAccess" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FolderAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthFolder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "yearFolderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonthFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "assignedById" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'discord',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "actorImage" TEXT,
    "actorName" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "message" TEXT,
    "title" TEXT,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearFolder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "YearFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_cardId_idx" ON "Attachment"("cardId" ASC);
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId" ASC);
CREATE INDEX "Board_dayFolderId_idx" ON "Board"("dayFolderId" ASC);
CREATE INDEX "Board_orgId_idx" ON "Board"("orgId" ASC);
CREATE INDEX "Card_listId_idx" ON "Card"("listId" ASC);
CREATE INDEX "CardAssignment_cardId_idx" ON "CardAssignment"("cardId" ASC);
CREATE UNIQUE INDEX "CardAssignment_cardId_userId_key" ON "CardAssignment"("cardId" ASC, "userId" ASC);
CREATE INDEX "CardTag_cardId_idx" ON "CardTag"("cardId" ASC);
CREATE UNIQUE INDEX "CardTag_cardId_tagId_key" ON "CardTag"("cardId" ASC, "tagId" ASC);
CREATE INDEX "CardTag_tagId_idx" ON "CardTag"("tagId" ASC);
CREATE INDEX "Comment_cardId_idx" ON "Comment"("cardId" ASC);
CREATE INDEX "DayFolder_monthFolderId_idx" ON "DayFolder"("monthFolderId" ASC);
CREATE INDEX "Folder_orgId_idx" ON "Folder"("orgId" ASC);
CREATE INDEX "FolderAccess_folderId_idx" ON "FolderAccess"("folderId" ASC);
CREATE UNIQUE INDEX "FolderAccess_folderId_userId_key" ON "FolderAccess"("folderId" ASC, "userId" ASC);
CREATE INDEX "List_boardId_idx" ON "List"("boardId" ASC);
CREATE INDEX "MonthFolder_yearFolderId_idx" ON "MonthFolder"("yearFolderId" ASC);
CREATE INDEX "Notification_assignedToId_idx" ON "Notification"("assignedToId" ASC);
CREATE INDEX "Notification_taskId_idx" ON "Notification"("taskId" ASC);
CREATE INDEX "Subtask_cardId_idx" ON "Subtask"("cardId" ASC);
CREATE INDEX "Tag_orgId_idx" ON "Tag"("orgId" ASC);
CREATE INDEX "YearFolder_folderId_idx" ON "YearFolder"("folderId" ASC);
