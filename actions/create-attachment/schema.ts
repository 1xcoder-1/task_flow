import { z } from "zod";
export const CreateAttachment = z.object({
  url: z.string().min(1),
  type: z.string(),
  title: z.string().optional(),
  cardId: z.string(),
  boardId: z.string(),
});
