"use client";

import { RoomProvider } from "@liveblocks/react/suspense";
import { PropsWithChildren } from "react";

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
