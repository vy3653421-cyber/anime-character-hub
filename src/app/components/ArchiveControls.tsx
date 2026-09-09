"use client";

import { Search, SlidersHorizontal, Star, X } from "lucide-react";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  filter: "all" | "saved";
  onFilterChange: (value: "all" | "saved") => void;
  savedCount: number;
};

export function ArchiveControls({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  savedCount,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
        <input
          id="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search characters…"
          aria-label="Search characters"
          className="w-full rounded-full border border-white/10 bg-white/[.045] py-3 pl-11 pr-10 text-sm outline-none transition placeholder:text-white/30 focus:border-violet-300/50 focus:bg-white/[.07]"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 hover:text-white"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex rounded-full border border-white/10 bg-white/[.035] p-1">
        <button
          onClick={() => onFilterChange("all")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === "all" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
        >
          <SlidersHorizontal size={13} /> All characters
        </button>
        <button
          onClick={() => onFilterChange("saved")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === "saved" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
        >
          <Star size={13} fill={filter === "saved" ? "currentColor" : "none"} /> Saved {savedCount > 0 && `· ${savedCount}`}
        </button>
      </div>
    </div>
  );
}
