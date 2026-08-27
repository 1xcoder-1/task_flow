import { z } from "zod";

export const UpdateNestedFolder = z.object({
  id: z.string(),
  title: z.string({
    message: "Title is required",
  }).min(3, {
    message: "Title is too short",
  }),
  type: z.enum(["year", "month", "day"]),
  path: z.string(),
});
