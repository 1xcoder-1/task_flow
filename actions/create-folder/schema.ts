import { z } from "zod";

export const CreateFolder = z.object({
  title: z
    .string({
      error: "Title is required.",
    })
    .min(3, {
      message: "Title is too short.",
    }),
  logoUrl: z.string().optional(),
  password: z
    .string({
      error: "Password is required.",
    })
    .min(1, {
      message: "Password is required.",
    }),
});
