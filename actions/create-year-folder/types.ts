import { z } from "zod";
import { YearFolder } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateYearFolder } from "./schema";

export type InputType = z.infer<typeof CreateYearFolder>;
export type ReturnType = ActionState<InputType, YearFolder>;
