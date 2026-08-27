import { z } from "zod";
export const DeleteSubtask = z.object({
  id: z.string(),
  boardId: z.string(),
});
