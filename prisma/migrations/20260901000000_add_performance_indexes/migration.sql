CREATE INDEX IF NOT EXISTS "Folder_orgId_idx" ON "Folder"("orgId");
CREATE INDEX IF NOT EXISTS "Board_orgId_idx" ON "Board"("orgId");
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx" ON "AuditLog"("orgId");
CREATE INDEX IF NOT EXISTS "Notification_assignedToId_idx" ON "Notification"("assignedToId");
