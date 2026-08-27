import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteFolder } from "./schema";
import { Folder } from "@prisma/client";

export type InputType = z.infer<typeof DeleteFolder>;
export type ReturnType = ActionState<InputType, Folder>;
