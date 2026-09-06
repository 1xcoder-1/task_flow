import type { Card, List, Comment, Attachment, CardAssignment, Subtask } from "@prisma/client";

export type CardWithRelations = Card & {
  comments?: Comment[];
  attachments?: Attachment[];
  assignments?: CardAssignment[];
  subtasks?: Subtask[];
  tags?: any[];
  _count?: {
    attachments: number;
    comments: number;
    subtasks: number;
  };
};

export type ListWithCards = List & { cards: CardWithRelations[] };
export type CardWithList = CardWithRelations & { list: List };

// TaskFlow Build Release v1.0.1
