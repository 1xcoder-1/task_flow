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
    <div className="flex items-center gap-x-3 px-4 py-2.5 bg-black/50 backdrop-blur-md text-white border border-white/15 text-xs shrink-0 z-30 shadow-md rounded-xl mb-2">
      {/* Label */}
      <div className="flex items-center gap-x-2 text-white font-medium shrink-0 mr-1 text-xs uppercase tracking-widest drop-shadow-sm">
        <Filter className="h-4 w-4 text-orange-400" />
        Filter:
      </div>

      {/* Left Scroll Button (<) */}
      <button
        type="button"
        onClick={handleScrollLeft}
        aria-label="Scroll tags left"
        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition border border-white/15 shadow-inner"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scrollable Tag List Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-x-2.5 overflow-x-auto scroll-smooth no-scrollbar py-1 px-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className={`px-3.5 py-1.5 rounded-full font-medium transition text-xs shrink-0 tracking-wide ${activeTagId === null
              ? "bg-orange-500 text-white shadow-md border border-orange-400"
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
        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition border border-white/15 shadow-inner"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Clear Filter Button */}
      {activeTagId && (
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className="flex items-center gap-x-1.5 text-white font-medium ml-2 shrink-0 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition shadow-sm border border-white/15 tracking-wide"
        >
          <X className="h-4 w-4" /> Clear
        </button>
      )}
    </div>
  );
};
