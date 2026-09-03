"use client";

import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface CollapsibleLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleLayout = ({
  sidebar,
  children,
}: CollapsibleLayoutProps) => {
  const { isCollapsed, expand } = useSidebar();

  return (
    <div className="flex gap-x-10 h-full relative overflow-x-hidden">
      <div
        className={cn(
          "shrink-0 hidden md:block border-r border-slate-200 pr-6 pt-4 min-h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-0 p-0 overflow-hidden border-r-0 opacity-0" : "w-72 opacity-100"
        )}
      >
        {sidebar}
      </div>

      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expand sidebar"
          onClick={expand}
          className="hidden md:flex absolute top-4 left-0 z-50 h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-white border shadow-sm rounded-l-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div className={cn(
        "flex-1 min-w-0 w-full pt-4 transition-all duration-300 ease-in-out",
        isCollapsed ? "pl-8 pr-4" : "pl-0 pr-2 md:pl-2"
      )}>
        {children}
      </div>
    </div>
  );
};
