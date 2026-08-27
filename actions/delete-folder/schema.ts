import { z } from "zod";

export const DeleteFolder = z.object({
  id: z.string(),
});
