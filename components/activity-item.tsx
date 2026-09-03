import { format } from "date-fns";
import { ACTION, AuditLog } from "@prisma/client";
import { Plus, Edit3, Trash2, UserCheck } from "lucide-react";

import { generateLogMessage } from "@/lib/generate-log-messages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type ActivityItemProps = {
  data: AuditLog;
};

export const ActivityItem = ({ data }: ActivityItemProps) => {
  const cleanName = data.userName?.replace(/\s*\(Admin\)/g, "").trim() || "Teammate";
  const initials = cleanName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  let actionBadge = (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full shrink-0">
      <Edit3 className="h-3 w-3 text-sky-600" />
      Update
    </span>
  );

  if (data.action === ACTION.CREATE) {
    if (data.entityType === "CARD" && data.entityTitle.includes(" to ")) {
      actionBadge = (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
          <UserCheck className="h-3 w-3 text-purple-600" />
          Assign
        </span>
      );
    } else {
      actionBadge = (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
          <Plus className="h-3 w-3 text-emerald-600" />
          Create
        </span>
      );
    }
  } else if (data.action === ACTION.DELETE) {
    actionBadge = (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
        <Trash2 className="h-3 w-3 text-rose-600" />
        Delete
      </span>
    );
  }

  return (
    <li className="bg-white border border-gray-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 min-w-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-9 w-9 border border-slate-200 shrink-0">
          {data.userImage && <AvatarImage src={data.userImage} alt={cleanName} />}
          <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs sm:text-sm text-slate-800 truncate leading-snug">
            <span className="font-bold text-slate-900">{cleanName}</span>{" "}
            <span className="text-slate-600 font-medium">{generateLogMessage(data)}</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {format(new Date(data.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {actionBadge}
      </div>
    </li>
  );
};
