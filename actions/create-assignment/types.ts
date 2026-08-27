import { z } from "zod";
import { CardAssignment } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateAssignment } from "./schema";

export type InputType = z.infer<typeof CreateAssignment>;
export type ReturnType = ActionState<InputType, CardAssignment>;
