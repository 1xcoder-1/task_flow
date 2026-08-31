import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { CreateTag } from "./schema";

export interface Tag {
  id: string;
  name: string;
  color: string;
  orgId: string;
  createdAt: Date;
}

export type InputType = z.infer<typeof CreateTag>;
export type ReturnType = ActionState<InputType, Tag>;
