import { z } from "zod";

export const RestoreItem = z.object({
  type: z.enum(["CARD", "LIST", "BOARD", "FOLDER", "YEAR_FOLDER", "MONTH_FOLDER", "DAY_FOLDER"]),
  id: z.string(),
  boardId: z.string().optional(),
});
