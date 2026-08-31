"use client";

import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { PropsWithChildren } from "react";
import { Loader2 } from "lucide-react";

export const LiveblocksRoomProvider = ({
  children,
  roomId,
}: PropsWithChildren<{ roomId: string }>) => {
  return (
    <RoomProvider id={roomId} initialPresence={{}}>
      {children}
    </RoomProvider>
  );
};
