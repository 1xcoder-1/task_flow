import { cache } from "react";

import { db } from "@/lib/db";

export const getBoard = cache(async (boardId: string, orgId: string) =>
  db.board.findUnique({
    where: { id: boardId, orgId },
  })
);
