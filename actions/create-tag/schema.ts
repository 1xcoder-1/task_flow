import { z } from "zod";

export const CreateTag = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().min(1, "Tag color is required"),
});
