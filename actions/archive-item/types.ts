import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { ArchiveItem } from "./schema";

export type InputType = z.infer<typeof ArchiveItem>;
export type ReturnType = ActionState<InputType, any>;
