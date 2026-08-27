"use client";

import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { PropsWithChildren } from "react";

export const LiveblocksAppProvider = ({ children }: PropsWithChildren) => {
  // We use a fallback key to prevent crashes during dev, but you MUST replace this with your real key in .env
  const apiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_YOUR_KEY_HERE";
  
  return (
    <LiveblocksProvider publicApiKey={apiKey}>
      {children}
    </LiveblocksProvider>
  );
};
