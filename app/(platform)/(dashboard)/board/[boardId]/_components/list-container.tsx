"use client";

import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { toast } from "sonner";
import { DragDropContext, type DropResult, Droppable } from "@hello-pangea/dnd";
import { useEventListener } from "@liveblocks/react";

import { ListForm } from "./list-form";
import { ListItem } from "./list-item";

import type { ListWithCards } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { updateCardOrder } from "@/actions/update-card-order";
import { useRouter } from "next/navigation";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { useCardOverlayStore } from "@/hooks/use-card-assignment-overlay";
import { statusFromListTitle } from "@/lib/card-status";

type ListContainerProps = {
  data: ListWithCards[];
  boardId: string;
  isImpBoard?: boolean;
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

const subscribeNoop = () => () => { };
const getSnapshotClient = () => true;
const getSnapshotServer = () => false;
const BoardDragDropView = ({
  onDragEnd,
  displayData,
  isImpBoard,
  addOptimisticCard,
  replaceOptimisticCard,
  removeOptimisticCard,
  addOptimisticList,
  replaceOptimisticList,
  removeOptimisticList,
}: any) => (
  <div className="min-h-0 flex-1 overflow-x-auto px-4 pt-2 board-scrollbar">
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex gap-x-3 h-full pb-4"
          >
            {displayData.map((list: any, i: number) => (
              <ListItem
                key={list.id}
                index={i}
                data={list}
                isImpBoard={isImpBoard}
                onCardCreated={addOptimisticCard}
                onCardSaved={replaceOptimisticCard}
                onCardFailed={removeOptimisticCard}
              />
            ))}

            {provided.placeholder}

            <ListForm
              onListCreated={addOptimisticList}
              onListSaved={replaceOptimisticList}
              onListFailed={removeOptimisticList}
            />
            <div aria-hidden className="flex-shrink-0 w-1" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  </div>
);

export const ListContainer = ({ data, boardId, isImpBoard }: ListContainerProps) => {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    getSnapshotClient,
    getSnapshotServer
  );
  const [orderedData, setOrderedData] = useState(data);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const overlays = useCardOverlayStore((state) => state.byCardId);
  const localListIdsRef = useRef<Set<string>>(new Set());

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setOrderedData((prev) => {
      const extras = prev.filter((list) => {
        if (!localListIdsRef.current.has(list.id)) return false;
        if (data.some((serverList) => serverList.id === list.id)) return false;
        if (String(list.id).startsWith("temp-") && data.some((serverList) => serverList.title === list.title)) {
          return false;
        }
        return true;
      });

      const merged = data.map((serverList) => {
        const local = prev.find((list) => list.id === serverList.id);
        if (!local) return serverList;
        const tempCards = (local.cards || []).filter((card: any) => String(card.id).startsWith("temp-"));
        if (tempCards.length === 0) return serverList;
        const serverCardIds = new Set((serverList.cards || []).map((card: any) => card.id));
        return {
          ...serverList,
          cards: [
            ...(serverList.cards || []),
            ...tempCards.filter((card: any) => !serverCardIds.has(card.id)),
          ],
        };
      });

      return extras.length ? [...merged, ...extras] : merged;
    });
  }

  const listsWithLiveCards = orderedData.map((list) => ({
    ...list,
    cards: (list.cards || [])
      .filter((card: any) => {
        if (isImpBoard && card.createdAt) {
          const createdTime = new Date(card.createdAt).getTime();
          if (!isNaN(createdTime)) {
            const isExpired = Date.now() - createdTime >= 24 * 60 * 60 * 1000;
            if (isExpired) return false;
          }
        }
        return true;
      })
      .map((card: any) => {
        const overlay = overlays[card.id];
        if (!overlay) return card;
        return {
          ...card,
          priority: overlay.priority ?? card.priority,
          status: overlay.status ?? card.status,
          isActive: overlay.isActive ?? card.isActive,
          tags: overlay.tags ?? card.tags,
          assignments: overlay.assignments ?? card.assignments,
          dueDate: overlay.dueDate !== undefined ? overlay.dueDate : card.dueDate,
          title: overlay.title ?? card.title,
          description: overlay.description !== undefined ? overlay.description : card.description,
        };
      }),
  }));

  // Extract all unique tags on cards in this board
  const tagMap = new Map();
  for (const list of listsWithLiveCards) {
    for (const card of (list.cards || [])) {
      for (const ct of (card.tags || [])) {
        if (ct && (ct.tag || ct.id)) {
          const tagId = ct.tag?.id || ct.tagId || ct.id;
          tagMap.set(tagId, ct.tag || ct);
        }
      }
    }
  }
  const allBoardTags = Array.from(tagMap.values());

  const displayData = activeTagId
    ? listsWithLiveCards.map((list) => ({
      ...list,
      cards: (list.cards || []).filter((card: any) =>
        card.tags?.some((ct: any) => ct.tagId === activeTagId || ct.tag?.id === activeTagId)
      ),
    }))
    : listsWithLiveCards;

  useEventListener(({ event }) => {
    const customEvent = event as { type?: string; data?: any };
    if (customEvent.type === "CARD_CREATED" || customEvent.type === "CARD_MOVED" || customEvent.type === "LIST_MOVED") {
      router.refresh(); // Or optimistically apply event.data
    }
  });

  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: (data) => {
      toast.success("List reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: (data) => {
      toast.success("Card reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });



  // Prevent rendering DND until mounted to fix Strict Mode hydration errors
  if (!isMounted) {
    return null;
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    // if no destination
    if (!destination) return;

    // if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // user moves a list
    if (type === "list") {
      const items = reorder(orderedData, source.index, destination.index).map(
        (item, index) => ({ ...item, order: index })
      );

      setOrderedData(items);

      // update list order in server
      executeUpdateListOrder({
        items,
        boardId,
      });
    }

    // user moves a card
    if (type === "card") {
      let newOrderedData = [...orderedData];

      // source and destination list
      const sourceListIndex = newOrderedData.findIndex(
        (list) => list.id === source.droppableId
      );
      const destListIndex = newOrderedData.findIndex(
        (list) => list.id === destination.droppableId
      );

      if (sourceListIndex === -1 || destListIndex === -1) return;

      // clone the lists and their cards to avoid direct mutation of state
      const sourceList = {
        ...newOrderedData[sourceListIndex],
        cards: newOrderedData[sourceListIndex].cards ? [...newOrderedData[sourceListIndex].cards] : []
      };

      const destinationList = sourceListIndex === destListIndex
        ? sourceList
        : {
          ...newOrderedData[destListIndex],
          cards: newOrderedData[destListIndex].cards ? [...newOrderedData[destListIndex].cards] : []
        };

      newOrderedData[sourceListIndex] = sourceList;
      newOrderedData[destListIndex] = destinationList;

      // moving the card in the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(
          sourceList.cards,
          source.index,
          destination.index
        );

        sourceList.cards = reorderedCards.map((card, i) => ({
          ...card,
          order: i,
        }));

        setOrderedData(newOrderedData);

        executeUpdateCardOrder({
          boardId,
          items: sourceList.cards.map(({ id, order, listId }) => ({ id, order, listId })),
        });
      }
      // user moves card to another list
      else {
        // remove card from the source list
        const [movedCard] = sourceList.cards.splice(source.index, 1);
        const statusPatch = statusFromListTitle(destinationList.title);
        const updatedCard = {
          ...movedCard,
          listId: destination.droppableId,
          ...statusPatch,
        };

        useCardOverlayStore.getState().patchCard(updatedCard.id, statusPatch);

        destinationList.cards.splice(destination.index, 0, updatedCard);

        sourceList.cards = sourceList.cards.map((card, i) => ({
          ...card,
          order: i,
        }));

        destinationList.cards = destinationList.cards.map((card, i) => ({
          ...card,
          order: i,
        }));

        setOrderedData(newOrderedData);

        executeUpdateCardOrder({
          boardId: boardId,
          items: [...sourceList.cards, ...destinationList.cards].map((card) => ({
            id: card.id,
            order: card.order,
            listId: card.listId,
            ...(card.id === updatedCard.id
              ? { status: statusPatch.status, isActive: statusPatch.isActive }
              : {}),
          })),
        });
      }
    }
  };

  const addOptimisticCard = (listId: string, card: any) => {
    setOrderedData((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, cards: [...(list.cards || []), card] } : list
      )
    );
  };

  const replaceOptimisticCard = (listId: string, tempId: string, card: any) => {
    setOrderedData((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, cards: (list.cards || []).map((item) => item.id === tempId ? { ...item, ...card } : item) }
          : list
      )
    );
  };

  const removeOptimisticCard = (listId: string, tempId: string) => {
    setOrderedData((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, cards: (list.cards || []).filter((item) => item.id !== tempId) }
          : list
      )
    );
  };

  const addOptimisticList = (list: any) => {
    localListIdsRef.current.add(list.id);
    setOrderedData((prev) => prev.some((item) => item.id === list.id) ? prev : [...prev, list]);
  };

  const replaceOptimisticList = (tempId: string, list: any) => {
    localListIdsRef.current.delete(tempId);
    localListIdsRef.current.add(list.id);
    setOrderedData((prev) =>
      prev.map((item) => item.id === tempId ? { ...item, ...list, cards: item.cards || [] } : item)
    );
  };

  const removeOptimisticList = (tempId: string) => {
    localListIdsRef.current.delete(tempId);
    setOrderedData((prev) => prev.filter((item) => item.id !== tempId));
  };

  return (
    <div className="h-full w-full flex flex-col">
      {allBoardTags.length > 0 && (
        <TagFilterBar
          tags={allBoardTags}
          activeTagId={activeTagId}
          onSelectTag={setActiveTagId}
        />
      )}
      <BoardDragDropView
        onDragEnd={onDragEnd}
        displayData={displayData}
        isImpBoard={isImpBoard}
        addOptimisticCard={addOptimisticCard}
        replaceOptimisticCard={replaceOptimisticCard}
        removeOptimisticCard={removeOptimisticCard}
        addOptimisticList={addOptimisticList}
        replaceOptimisticList={replaceOptimisticList}
        removeOptimisticList={removeOptimisticList}
      />
    </div>
  );
};
