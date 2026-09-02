import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { RestoreItem } from "./schema";

export type InputType = z.infer<typeof RestoreItem>;
export type ReturnType = ActionState<InputType, any>;
