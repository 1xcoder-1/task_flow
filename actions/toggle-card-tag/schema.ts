import { z } from "zod";

export const ToggleCardTag = z.object({
  cardId: z.string(),
  tagId: z.string(),
  boardId: z.string(),
});
