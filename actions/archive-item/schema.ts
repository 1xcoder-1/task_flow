import { z } from "zod";

export const ArchiveItem = z.object({
  type: z.enum(["CARD", "LIST", "BOARD", "FOLDER"]),
  id: z.string(),
  boardId: z.string().optional(),
});
