import { z } from "zod";

export const DeletePermanently = z.object({
  type: z.enum(["CARD", "LIST", "BOARD", "FOLDER", "YEAR_FOLDER", "MONTH_FOLDER", "DAY_FOLDER", "EMPTY_TRASH"]),
  id: z.string().optional(),
  boardId: z.string().optional(),
});
