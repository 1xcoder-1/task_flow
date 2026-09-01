"use client";

import Link from "next/link";
import { type ComponentProps, useState } from "react";
import { Loader2 } from "lucide-react";

type BoardLinkProps = ComponentProps<typeof Link>;

export const BoardLink = ({ children, onClick, ...props }: BoardLinkProps) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Link
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            setIsLoading(true);
          }
        }}
      >
        {children}
      </Link>
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090d16]/60 backdrop-blur-md transition-all duration-200" role="status" aria-label="Opening board">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0f172a]/90 border border-slate-700/50 shadow-2xl shadow-sky-950/40 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <Loader2 className="h-6 w-6 animate-spin text-sky-400" strokeWidth={2.2} />
            <span className="text-xs font-semibold tracking-wide text-slate-200">Opening board...</span>
          </div>
        </div>
      )}
    </>
  );
};
