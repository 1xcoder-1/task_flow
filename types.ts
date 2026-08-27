import type { Card, List, Comment, Attachment, CardAssignment, Subtask } from "@prisma/client";

export type CardWithRelations = Card & {
  comments?: Comment[];
  attachments?: Attachment[];
  assignments?: CardAssignment[];
  subtasks?: Subtask[];
};

export type ListWithCards = List & { cards: CardWithRelations[] };
export type CardWithList = CardWithRelations & { list: List };
