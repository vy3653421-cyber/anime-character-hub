"use client";

import { ArrowDownAZ, RotateCcw, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  filter: "all" | "saved";
  onFilterChange: (value: "all" | "saved") => void;
  sort: "popular" | "name";
  onSortChange: (value: "popular" | "name") => void;
  savedCount: number;
  onReset: () => void;
};

export function ArchiveControls({ query, onQueryChange, filter, onFilterChange, sort, onSortChange, savedCount, onReset }: Props) {
  const hasActiveView = Boolean(query) || filter === "saved" || sort === "name";
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");

  useEffect(() => {
    setShortcutLabel(/Mac|iPhone|iPad|iPod/i.test(window.navigator.platform) ? "⌘ K" : "Ctrl K");
  }, []);

  return (
    <div className="space-y-3 lg:sticky lg:top-4 lg:z-30">
      <div className="rounded-3xl border border-white/8 bg-[#0a0a0f]/75 p-2 shadow-[0_18px_60px_rgba(0,0,0,.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="group relative w-full min-w-0 lg:max-w-2xl lg:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors duration-300 group-focus-within:text-violet-300" size={16} aria-hidden="true" />
            <label htmlFor="search" className="sr-only">Search characters</label>
            <input id="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search the character archive…" autoComplete="off" spellCheck={false} className="w-full rounded-2xl border border-transparent bg-white/[.035] py-3.5 pl-11 pr-24 text-sm outline-none transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-white/30 focus:border-violet-300/35 focus:bg-white/[.065] focus:shadow-[0_0_0_4px_rgba(167,139,250,.06)]" />
            {!query && <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-white/8 bg-white/[.04] px-2 py-1 text-[9px] font-medium text-white/25 sm:flex" aria-hidden="true"><span>{shortcutLabel}</span></div>}
            {query && <button type="button" onClick={() => onQueryChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/[.06] p-1.5 text-white/40 transition duration-300 hover:scale-105 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80" aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-white/8 bg-white/[.025] p-1">
              <button type="button" onClick={() => onFilterChange("all")} aria-pressed={filter === "all"} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-[background-color,color,transform] duration-300 ${filter === "all" ? "bg-white text-black shadow-lg shadow-black/20" : "text-white/50 hover:-translate-y-px hover:text-white"}`}><SlidersHorizontal size={13} aria-hidden="true" /> All</button>
              <button type="button" onClick={() => onFilterChange("saved")} aria-pressed={filter === "saved"} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-[background-color,color,transform] duration-300 ${filter === "saved" ? "bg-white text-black shadow-lg shadow-black/20" : "text-white/50 hover:-translate-y-px hover:text-white"}`}><Star size={13} fill={filter === "saved" ? "currentColor" : "none"} aria-hidden="true" /> Saved {savedCount > 0 && `· ${savedCount}`}</button>
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[.025] px-3.5 py-2.5 text-xs text-white/55 transition-colors duration-300 hover:border-white/15 hover:text-white/75"><ArrowDownAZ size={13} aria-hidden="true" /><span className="sr-only">Sort characters</span><select value={sort} onChange={(event) => onSortChange(event.target.value as "popular" | "name")} aria-label="Sort characters" className="bg-transparent text-xs font-semibold text-white/70 outline-none [&>option]:bg-[#111116]"><option value="popular">Popular</option><option value="name">Name A–Z</option></select></label>

            {hasActiveView && <button type="button" onClick={onReset} className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[.025] px-3.5 py-2.5 text-xs font-semibold text-white/45 transition-[background-color,color,transform,border-color] duration-300 hover:-translate-y-px hover:border-violet-300/20 hover:bg-violet-300/[.06] hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"><RotateCcw size={13} aria-hidden="true" /> Reset</button>}
          </div>
        </div>
      </div>

      <div className="flex min-h-4 items-center justify-between px-1 text-[10px] uppercase tracking-[.18em] text-white/25"><span>{query ? `Searching for “${query}”` : filter === "saved" ? "Saved collection" : "Browse the archive"}</span><span className="hidden items-center gap-2 sm:flex">{hasActiveView && <span className="h-1 w-1 rounded-full bg-violet-300/70" aria-hidden="true" />}Live character index</span></div>
    </div>
  );
}
