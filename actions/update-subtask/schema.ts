import { z } from "zod";

export const UpdateSubtask = z.object({
  id: z.string(),
  isCompleted: z.boolean(),
  boardId: z.string(),
});
