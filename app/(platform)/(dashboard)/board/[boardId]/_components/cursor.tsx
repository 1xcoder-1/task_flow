"use client";

import { memo } from "react";
import { MousePointer2 } from "lucide-react";

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

export const Cursor = memo(({ x, y, color, name }: CursorProps) => {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-50 transition-transform duration-200 ease-out"
      style={{
        transform: `translateX(${x}px) translateY(${y}px)`,
      }}
    >
      <MousePointer2
        className="h-5 w-5"
        style={{
          fill: color,
          color: color,
        }}
      />
      <div
        className="absolute left-5 top-5 rounded-md px-1.5 py-0.5 text-xs font-semibold text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
});

Cursor.displayName = "Cursor";
