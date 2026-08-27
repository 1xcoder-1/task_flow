import { z } from "zod";

export const CreateAssignment = z.object({
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  cardId: z.string(),
  boardId: z.string(),
});
