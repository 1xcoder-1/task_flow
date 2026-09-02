import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { GetOrgStats } from "./schema";

export type InputType = z.infer<typeof GetOrgStats>;
export type ReturnType = ActionState<InputType, {
  totalMembers: number;
  activeTasks: number;
  totalTeams: number;
  activeUsers: number;
  offlineUsers: number;
}>;
