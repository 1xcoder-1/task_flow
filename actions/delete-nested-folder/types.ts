import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteNestedFolder } from "./schema";

export type InputType = z.infer<typeof DeleteNestedFolder>;
export type ReturnType = ActionState<InputType, any>;
