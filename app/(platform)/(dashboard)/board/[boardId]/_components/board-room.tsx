"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";

interface BoardRoomProps {
  children: ReactNode;
  roomId: string;
}

export const BoardRoom = ({ children, roomId }: BoardRoomProps) => {
  return (
    <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
      <ClientSideSuspense fallback={null}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
};
