import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { CreateSubtask } from "./schema";
import { Subtask } from "@prisma/client";

export type InputType = z.infer<typeof CreateSubtask>;
export type ReturnType = ActionState<InputType, Subtask>;
