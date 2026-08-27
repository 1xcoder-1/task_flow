import { z } from "zod";

export const GetOrgStats = z.object({
  orgId: z.string(),
});
