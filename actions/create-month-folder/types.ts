import { z } from "zod";
import { MonthFolder } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateMonthFolder } from "./schema";

export type InputType = z.infer<typeof CreateMonthFolder>;
export type ReturnType = ActionState<InputType, MonthFolder>;
