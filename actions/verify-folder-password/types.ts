import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { VerifyFolderPassword } from "./schema";

export type InputType = z.infer<typeof VerifyFolderPassword>;
export type ReturnType = ActionState<InputType, { success: boolean }>;
