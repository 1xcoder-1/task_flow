import { z } from "zod";

export const UpdateCardOrder = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      listId: z.string(),
      status: z.string().optional(),
      isActive: z.boolean().optional(),
    })
  ),
  boardId: z.string(),
});
