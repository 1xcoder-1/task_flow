import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { DeletePermanently } from "./schema";

export type InputType = z.infer<typeof DeletePermanently>;
export type ReturnType = ActionState<InputType, any>;
