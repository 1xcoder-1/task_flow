import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateFolder } from "./schema";
import { Folder } from "@prisma/client";

export type InputType = z.infer<typeof UpdateFolder>;
export type ReturnType = ActionState<InputType, Folder>;
