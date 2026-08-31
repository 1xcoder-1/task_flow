"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { Loader2 } from "lucide-react";

interface BoardRoomProps {
  children: ReactNode;
  roomId: string;
}

export const BoardRoom = ({ children, roomId }: BoardRoomProps) => {
  return (
    <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
      <ClientSideSuspense fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
};
