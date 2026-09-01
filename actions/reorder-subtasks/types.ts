import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { Subtask } from "@prisma/client";
import { ReorderSubtasks } from "./schema";

export type InputType = z.infer<typeof ReorderSubtasks>;
export type ReturnType = ActionState<InputType, Subtask[]>;
