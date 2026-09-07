"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { PropsWithChildren, useCallback } from "react";

export const LiveblocksAppProvider = ({ children }: PropsWithChildren) => {
  const authEndpoint = useCallback(async (room?: string) => {
    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed with status ${response.status}`);
    }

    return await response.json();
  }, []);

  return (
    <LiveblocksProvider
      authEndpoint={authEndpoint}
      lostConnectionTimeout={15000}
      backgroundKeepAliveTimeout={15 * 60 * 1000}
    >
      {children}
    </LiveblocksProvider>
  );
};
