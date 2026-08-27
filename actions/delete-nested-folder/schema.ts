import { z } from "zod";

export const DeleteNestedFolder = z.object({
  id: z.string(),
  type: z.enum(["year", "month", "day"]),
  path: z.string(),
});
