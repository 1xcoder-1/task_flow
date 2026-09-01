"use client";

import { ElementRef, useRef, useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";

import { ListHeader } from "./list-header";
import { CardItem } from "./card-item";
import { CardForm } from "./card-form";
import { ListWithCards } from "@/types";
import { cn } from "@/lib/utils";

type ListItemProps = {
  data: ListWithCards;
  index: number;
  isImpBoard?: boolean;
  onCardCreated?: (listId: string, card: any) => void;
  onCardSaved?: (listId: string, tempId: string, card: any) => void;
  onCardFailed?: (listId: string, tempId: string) => void;
};

export const ListItem = ({ data, index, isImpBoard, onCardCreated, onCardSaved, onCardFailed }: ListItemProps) => {
  const textareaRef = useRef<ElementRef<"textarea">>(null);

  const [isEditing, setIsEditing] = useState(false);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <li
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="shrink-0 h-full w-[272px] select-none"
        >
          <div
            className="w-full rounded-xl bg-[#f2f2f4] pb-2"
          >
            <ListHeader onAddCard={enableEditing} data={data} dragHandleProps={provided.dragHandleProps} />

            <Droppable droppableId={data.id} type="card">
              {(provided) => (
                <ol
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mx-2 px-1 py-0.5 flex flex-col gap-y-3 mt-2 min-h-[60px]"
                >
                  {data.cards.map((card, i) => (
                    <CardItem index={i} key={card.id} data={card} />
                  ))}

                  {provided.placeholder}
                </ol>
              )}
            </Droppable>

            <CardForm
              listId={data.id}
              listTitle={data.title}
              ref={textareaRef}
              isEditing={isEditing}
              enableEditing={enableEditing}
              disableEditing={disableEditing}
              isImpBoard={isImpBoard}
              onCardCreated={onCardCreated}
              onCardSaved={onCardSaved}
              onCardFailed={onCardFailed}
            />
          </div>
        </li>
      )}
    </Draggable>
  );
};
