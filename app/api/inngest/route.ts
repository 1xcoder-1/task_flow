import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendNotification, logActivity, handleFolderCreate, handleBoardCreate, handleListCopy, handleOrgInit, handleFolderInit } from "@/inngest/functions";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendNotification,
    logActivity,
    handleFolderCreate,
    handleBoardCreate,
    handleListCopy,
    handleOrgInit,
    handleFolderInit,
  ],
});
