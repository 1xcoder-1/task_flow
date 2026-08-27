import { z } from "zod";
export const CreateAttachment = z.object({
  url: z.string().url(),
  type: z.string(),
  title: z.string().optional(),
  cardId: z.string(),
  boardId: z.string(),
});
