import { z } from "zod";

export const CreateMonthFolder = z.object({
  title: z
    .string({
      error: "Title is required.",
    })
    .min(1, {
      message: "Title is too short.",
    }),
  yearFolderId: z.string({
    error: "Year Folder is required.",
  }),
});
