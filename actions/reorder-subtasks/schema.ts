import { z } from "zod";

export const ReorderSubtasks = zodSchema();

function zodSchema() {
  return z.object({
    cardId: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        isCompleted: z.boolean(),
        createdAt: z.string().or(z.date()),
        updatedAt: z.string().or(z.date()),
      })
    ),
  });
}
