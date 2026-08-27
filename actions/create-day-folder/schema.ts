import { z } from "zod";

export const CreateDayFolder = z.object({
  title: z
    .string({
      error: "Title is required.",
    })
    .min(1, {
      message: "Title is too short.",
    }),
  monthFolderId: z.string({
    error: "Month Folder is required.",
  }),
});
