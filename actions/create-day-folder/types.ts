import { z } from "zod";
import { DayFolder } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateDayFolder } from "./schema";

export type InputType = z.infer<typeof CreateDayFolder>;
export type ReturnType = ActionState<InputType, DayFolder>;
