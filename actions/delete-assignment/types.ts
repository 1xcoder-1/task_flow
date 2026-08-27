import { z } from "zod";
import { CardAssignment } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteAssignment } from "./schema";

export type InputType = z.infer<typeof DeleteAssignment>;
export type ReturnType = ActionState<InputType, CardAssignment>;
