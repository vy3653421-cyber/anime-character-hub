"use client";

import { ArrowDownAZ, Search, SlidersHorizontal, Star, X } from "lucide-react";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  filter: "all" | "saved";
  onFilterChange: (value: "all" | "saved") => void;
  sort: "popular" | "name";
  onSortChange: (value: "popular" | "name") => void;
  savedCount: number;
};

export function ArchiveControls({ query, onQueryChange, filter, onFilterChange, sort, onSortChange, savedCount }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="group relative w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35 transition group-focus-within:text-violet-300" size={16} aria-hidden="true" />
          <label htmlFor="search" className="sr-only">Search characters</label>
          <input
            id="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search the character archive…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-2xl border border-white/10 bg-white/[.045] py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-white/30 focus:border-violet-300/50 focus:bg-white/[.07]"
          />
          {query && (
            <button type="button" onClick={() => onQueryChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/35 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80" aria-label="Clear search">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-2xl border border-white/10 bg-white/[.035] p-1">
            <button type="button" onClick={() => onFilterChange("all")} aria-pressed={filter === "all"} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${filter === "all" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>
              <SlidersHorizontal size={13} aria-hidden="true" /> All
            </button>
            <button type="button" onClick={() => onFilterChange("saved")} aria-pressed={filter === "saved"} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${filter === "saved" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>
              <Star size={13} fill={filter === "saved" ? "currentColor" : "none"} aria-hidden="true" /> Saved {savedCount > 0 && `· ${savedCount}`}
            </button>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.035] px-3.5 py-2.5 text-xs text-white/55">
            <ArrowDownAZ size={13} aria-hidden="true" />
            <span className="sr-only">Sort characters</span>
            <select value={sort} onChange={(event) => onSortChange(event.target.value as "popular" | "name")} aria-label="Sort characters" className="bg-transparent text-xs font-semibold text-white/70 outline-none [&>option]:bg-[#111116]">
              <option value="popular">Popular</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[.18em] text-white/25">
        <span>{query ? `Searching for “${query}”` : "Browse the archive"}</span>
        <span className="hidden sm:block">Live character index</span>
      </div>
    </div>
  );
}
