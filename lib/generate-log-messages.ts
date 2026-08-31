import { ACTION, AuditLog } from "@prisma/client";

export const generateLogMessage = (log: AuditLog) => {
  const { action, entityTitle, entityType } = log;

  switch (action) {
    case ACTION.CREATE:
      // Assignment logs have entityTitle like: 'Abdullah to "Fix bug"'
      if (entityType === "CARD" && entityTitle.includes(" to ")) {
        return `assigned ${entityTitle}`;
      }
      return `created ${entityType.toLowerCase()} "${entityTitle}"`;
    case ACTION.UPDATE:
      return `updated ${entityType.toLowerCase()} "${entityTitle}"`;
    case ACTION.DELETE:
      return `deleted ${entityType.toLowerCase()} "${entityTitle}"`;
    default:
      return `unknown action on ${entityType.toLowerCase()} "${entityTitle}"`;
  }
};
