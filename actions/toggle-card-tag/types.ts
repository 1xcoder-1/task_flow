import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { ToggleCardTag } from "./schema";

export type InputType = z.infer<typeof ToggleCardTag>;
export type ReturnType = ActionState<InputType, { cardId: string; tagId: string; attached: boolean }>;
