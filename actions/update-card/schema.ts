import { z } from "zod";

export const UpdateCard = z.object({
  boardId: z.string(),
  description: z.optional(
    z
      .string({
        error: "Description is required.",
      })
      .min(3, {
        message: "Description is too short.",
      }),
  ),
  title: z.optional(
    z
      .string({
        error: "Title is required.",
      })
      .min(3, {
        message: "Title is too short.",
      }),
  ),
  isActive: z.optional(z.boolean()),
  priority: z.optional(z.string()),
  dueDate: z.optional(z.coerce.date().nullable()),
  id: z.string(),
});
