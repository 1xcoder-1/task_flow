"use client";

import { usePathname } from "next/navigation";

export const ConditionalNavbar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isBoardPage = pathname.startsWith("/board/");

  if (isBoardPage) {
    return null;
  }

  return <>{children}</>;
};
