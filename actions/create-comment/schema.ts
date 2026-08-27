import { z } from "zod";
export const CreateComment = z.object({
  text: z.string().min(1, "Comment cannot be empty"),
  cardId: z.string(),
  boardId: z.string(),
});
