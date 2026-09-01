"use client";

import { create } from "zustand";

export type OverlayAssignment = {
  id: string;
  cardId: string;
  userId: string;
  userName: string;
  userImage: string;
};

export type CardOverlay = {
  assignments?: OverlayAssignment[];
  tags?: any[];
  priority?: string;
  status?: string;
  isActive?: boolean;
  dueDate?: string | Date | null;
  title?: string;
  description?: string | null;
};

type CardOverlayStore = {
  byCardId: Record<string, CardOverlay>;
  patchCard: (cardId: string, patch: CardOverlay) => void;
  setCardAssignments: (cardId: string, assignments: OverlayAssignment[]) => void;
};

export const useCardOverlayStore = create<CardOverlayStore>((set) => ({
  byCardId: {},
  patchCard: (cardId, patch) =>
    set((state) => ({
      byCardId: {
        ...state.byCardId,
        [cardId]: { ...state.byCardId[cardId], ...patch },
      },
    })),
  setCardAssignments: (cardId, assignments) =>
    set((state) => ({
      byCardId: {
        ...state.byCardId,
        [cardId]: { ...state.byCardId[cardId], assignments },
      },
    })),
}));

/** @deprecated use useCardOverlayStore */
export const useCardAssignmentOverlay = useCardOverlayStore;

export const useCardOverlay = (cardId: string) =>
  useCardOverlayStore((state) => state.byCardId[cardId]);

export const mergeCardWithOverlay = <T extends { id: string }>(card: T): T => {
  const overlay = useCardOverlayStore.getState().byCardId[card.id];
  if (!overlay) return card;
  return {
    ...card,
    ...(overlay.priority !== undefined ? { priority: overlay.priority } : {}),
    ...(overlay.status !== undefined ? { status: overlay.status } : {}),
    ...(overlay.isActive !== undefined ? { isActive: overlay.isActive } : {}),
    ...(overlay.tags !== undefined ? { tags: overlay.tags } : {}),
    ...(overlay.assignments !== undefined ? { assignments: overlay.assignments } : {}),
    ...(overlay.dueDate !== undefined ? { dueDate: overlay.dueDate } : {}),
    ...(overlay.title !== undefined ? { title: overlay.title } : {}),
    ...(overlay.description !== undefined ? { description: overlay.description } : {}),
  } as T;
};

export const useCardAssignments = <T extends OverlayAssignment>(
  cardId: string,
  serverAssignments?: T[] | null
) => {
  const overlay = useCardOverlayStore((state) => state.byCardId[cardId]?.assignments);
  return overlay ?? serverAssignments ?? [];
};
