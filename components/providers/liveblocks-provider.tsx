"use client";

import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { PropsWithChildren, useCallback } from "react";

export const LiveblocksAppProvider = ({ children }: PropsWithChildren) => {
  const authEndpoint = useCallback(async (room?: string) => {
    try {
      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room }),
      });

      if (!response.ok) {
        throw new Error(`Auth failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("Liveblocks client auth fetch error:", error);
      throw error;
    }
  }, []);

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      {children}
    </LiveblocksProvider>
  );
};
