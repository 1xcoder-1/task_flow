import { z } from "zod";

export const VerifyFolderPassword = z.object({
  id: z.string(),
  password: z.string({
    message: "Password is required",
  }),
});
