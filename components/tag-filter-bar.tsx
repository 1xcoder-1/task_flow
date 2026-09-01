"use client";

import { useRef } from "react";
import { TagBadge } from "@/components/tag-badge";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

interface TagFilterBarProps {
  tags: any[];
  activeTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
}

export const TagFilterBar = ({ tags, activeTagId, onSelectTag }: TagFilterBarProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!tags || tags.length === 0) return null;

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="flex items-center gap-x-2 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white border border-white/15 text-xs shrink-0 z-30 shadow-md rounded-lg mb-2 w-full">
      {/* Label */}
      <div className="flex items-center gap-x-1.5 text-white font-medium shrink-0 mr-1 text-[11px] uppercase tracking-wider drop-shadow-sm">
        <Filter className="h-3.5 w-3.5 text-orange-400" />
        Filter:
      </div>

      {/* Left Scroll Button (<) */}
      <button
        type="button"
        onClick={handleScrollLeft}
        aria-label="Scroll tags left"
        className="h-6.5 w-6.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition border border-white/15 shadow-inner p-1"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Scrollable Tag List Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-x-2 overflow-x-auto scroll-smooth no-scrollbar py-0.5 px-1 min-w-0 flex-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className={`px-2.5 py-1 rounded-full font-medium transition text-[11px] shrink-0 tracking-wide ${activeTagId === null
              ? "bg-orange-500 text-white shadow-sm border border-orange-400"
              : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
        >
          All Cards
        </button>

        {tags.map((tag) => {
          const isActive = activeTagId === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectTag(isActive ? null : tag.id)}
              className="transition rounded-full shrink-0 hover:scale-105"
            >
              <TagBadge name={tag.name} color={tag.color} size="md" variant="filter" isActive={isActive} />
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button (>) */}
      <button
        type="button"
        onClick={handleScrollRight}
        aria-label="Scroll tags right"
        className="h-6.5 w-6.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition border border-white/15 shadow-inner p-1"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Clear Filter Button */}
      {activeTagId && (
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className="flex items-center gap-x-1 text-white font-medium ml-1.5 shrink-0 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full transition shadow-sm border border-white/15 text-[11px] tracking-wide"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
};
