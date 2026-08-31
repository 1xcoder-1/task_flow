"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { DragDropContext, type DropResult, Droppable } from "@hello-pangea/dnd";
import { useEventListener } from "@liveblocks/react/suspense";

import { ListForm } from "./list-form";
import { ListItem } from "./list-item";

import type { ListWithCards } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { updateCardOrder } from "@/actions/update-card-order";
import { useRouter } from "next/navigation";
import { TagFilterBar } from "@/components/tag-filter-bar";

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

const subscribeNoop = () => () => {};
const getSnapshotClient = () => true;
const getSnapshotServer = () => false;

export const ListContainer = ({ data, boardId, isImpBoard }: ListContainerProps) => {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    getSnapshotClient,
    getSnapshotServer
  );
  const [orderedData, setOrderedData] = useState(data);
  const [prevData, setPrevData] = useState(data);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  if (data !== prevData) {
    setPrevData(data);
    setOrderedData(data);
  }

  // Extract all unique tags on cards in this board
  const allBoardTags = Array.from(
    new Map(
      orderedData
        .flatMap((list) => list.cards || [])
        .flatMap((card: any) => card.tags || [])
        .filter((ct: any) => ct && (ct.tag || ct.id))
        .map((ct: any) => [ct.tag?.id || ct.tagId || ct.id, ct.tag || ct])
    ).values()
  );

  const displayData = activeTagId
    ? orderedData.map((list) => ({
      ...list,
      cards: (list.cards || []).filter((card: any) =>
        card.tags?.some((ct: any) => ct.tagId === activeTagId || ct.tag?.id === activeTagId)
      ),
    }))
    : orderedData;

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

        // create a cloned card with the new list id
        const updatedCard = { ...movedCard, listId: destination.droppableId };

        // add new card to the destination list
        destinationList.cards.splice(destination.index, 0, updatedCard);

        sourceList.cards = sourceList.cards.map((card, i) => ({
          ...card,
          order: i,
        }));

        // update the order for each card in destination list
        destinationList.cards = destinationList.cards.map((card, i) => ({
          ...card,
          order: i,
        }));

        setOrderedData(newOrderedData);

        executeUpdateCardOrder({
          boardId: boardId,
          items: [...sourceList.cards, ...destinationList.cards].map(({ id, order, listId }) => ({ id, order, listId })),
        });
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <TagFilterBar
        tags={allBoardTags}
        activeTagId={activeTagId}
        onSelectTag={(tagId) => setActiveTagId(tagId)}
      />
      <div className="flex-1 overflow-x-auto p-4 pt-2">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="lists" type="list" direction="horizontal">
            {(provided) => (
              <ol
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex gap-x-3 h-full"
              >
                {displayData.map((list, i) => (
                  <ListItem key={list.id} index={i} data={list} isImpBoard={isImpBoard} />
                ))}

                {provided.placeholder}

                <ListForm />
                <div aria-hidden className="flex-shrink-0 w-1" />
              </ol>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};
