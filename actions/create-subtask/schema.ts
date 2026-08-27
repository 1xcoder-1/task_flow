import { z } from "zod";

export const CreateSubtask = z.object({
  title: z
    .string({
      error: "Title is required.",
    })
    .min(3, {
      message: "Title is too short.",
    }),
  cardId: z.string(),
  boardId: z.string(),
});
