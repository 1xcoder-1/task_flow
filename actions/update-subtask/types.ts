import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateSubtask } from "./schema";
import { Subtask } from "@prisma/client";

export type InputType = z.infer<typeof UpdateSubtask>;
export type ReturnType = ActionState<InputType, Subtask>;
