import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateNestedFolder } from "./schema";

export type InputType = z.infer<typeof UpdateNestedFolder>;
export type ReturnType = ActionState<InputType, any>;
