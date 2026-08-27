import { z } from "zod";

export const CreateYearFolder = z.object({
  title: z
    .string({
      error: "Title is required.",
    })
    .min(1, {
      message: "Title is too short.",
    }),
  folderId: z.string({
    error: "Folder is required.",
  }),
});
