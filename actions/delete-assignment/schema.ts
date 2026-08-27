import { z } from "zod";

export const DeleteAssignment = z.object({
  id: z.string(),
  boardId: z.string(),
});
