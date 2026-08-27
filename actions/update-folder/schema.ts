import { z } from "zod";

export const UpdateFolder = z.object({
  id: z.string(),
  title: z
    .string({
      message: "Title is required",
    })
    .min(3, {
      message: "Title is too short",
    }),
  logoUrl: z.string().optional(),
  password: z.string().optional(),
});
