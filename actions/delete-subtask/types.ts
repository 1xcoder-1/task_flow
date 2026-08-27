import { z } from "zod";
import { Subtask } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteSubtask } from "./schema";

export type InputType = z.infer<typeof DeleteSubtask>;
export type ReturnType = ActionState<InputType, Subtask>;
